import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { BadGatewayException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type Redis from 'ioredis';
import { ANTHROPIC_CLIENT } from '../common/anthropic';
import { DB, type Database } from '../db/db.module';
import { services, vendors, type AdDestination, type AdObjective } from '../db/schema';
import { REDIS } from '../redis/redis.module';
import { AD_COPY_RULES, AdCopySchema, buildAdCopyPrompt, tidyAdCopy, type AdCopy } from './ad-copy';

const AD_COPY_MODEL = 'claude-opus-5-5';
/** Drafts per business per day — each is 3 variants, so this is plenty. */
const DAILY_LIMIT = 20;

/** Writes ad text, the chat welcome message and quick questions with Claude. Backend only. */
@Injectable()
export class AdCopyService {
  private readonly logger = new Logger(AdCopyService.name);

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  get available(): boolean {
    return this.client !== null;
  }

  async draft(vendorId: string, input: { objective: AdObjective; destination: AdDestination; brief: string | null }): Promise<AdCopy> {
    if (!this.client) throw new ServiceUnavailableException('AI ad writing isn’t switched on yet — write your own text below.');
    const key = `ads:copy:${vendorId}:${new Date().toISOString().slice(0, 10)}`;
    const used = await this.redis.incr(key);
    if (used === 1) await this.redis.expire(key, 2 * 86_400);
    if (used > DAILY_LIMIT) throw new HttpException('You’ve used today’s AI ad drafts. Edit one of the drafts you have, or try tomorrow.', HttpStatus.TOO_MANY_REQUESTS);

    const [vendor] = await this.db.select({ businessName: vendors.businessName, category: vendors.category, description: vendors.description, address: vendors.address })
      .from(vendors).where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    const serviceRows = await this.db.select({ name: services.name, priceKobo: services.priceKobo })
      .from(services).where(eq(services.vendorId, vendorId)).orderBy(asc(services.name)).limit(40);

    const response = await this.client.beta.messages
      .parse({
        model: AD_COPY_MODEL,
        max_tokens: 8000,
        system: [{ type: 'text', text: AD_COPY_RULES, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildAdCopyPrompt({ ...vendor, services: serviceRows, ...input }) }],
        // Short creative writing from a few facts: medium effort is enough.
        output_config: { effort: 'medium', format: betaZodOutputFormat(AdCopySchema) },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      .catch(async (err: unknown): Promise<never> => {
        await this.redis.decr(key);
        if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError) {
          throw new ServiceUnavailableException('The AI is busy. Please try again in a minute.');
        }
        this.logger.error('Ad copy request failed', err instanceof Error ? err.stack : String(err));
        throw new BadGatewayException('The AI couldn’t write your ad just now. Please try again.');
      });
    const out = response.parsed_output;
    if (!out || response.stop_reason !== 'end_turn') throw new BadGatewayException('The AI couldn’t write your ad just now. Please try again.');
    const tidy = tidyAdCopy(out, input.destination);
    if (tidy.variants.length === 0) throw new BadGatewayException('The AI couldn’t write your ad just now. Please try again.');
    return tidy;
  }
}
