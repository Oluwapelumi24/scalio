import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { BadGatewayException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { asc, eq } from 'drizzle-orm';
import type Redis from 'ioredis';
import { ANTHROPIC_CLIENT } from '../common/anthropic';
import { DB, type Database } from '../db/db.module';
import { businessHours, inboxSettings, services, vendors, type FaqEntry, type InboxChannel } from '../db/schema';
import { HomeDataService } from '../personalisation/home-data.service';
import { REDIS } from '../redis/redis.module';
import { decideReply, type ReplyDecision } from './handoff';
import {
  FAQ_DRAFT_PROMPT, FaqDraftSchema, REPLY_RULES, ReplyDraftSchema, allowedAmounts, buildBusinessContext, buildReplyPrompt,
  type BusinessContext, type TranscriptLine,
} from './reply-writer';

/** Model for chat replies (D15: Opus for quality until a cheaper model passes a quality test). */
export const REPLY_MODEL = 'claude-opus-5-5';
const DEFAULT_DAILY_LIMIT = 300;

export interface ReplyRequest {
  channel: InboxChannel;
  customerName: string | null;
  adTitle: string | null;
  /** Oldest first. */
  transcript: TranscriptLine[];
}

/** Writes chat replies with Claude. Runs only on the backend; the API key never reaches the apps. */
@Injectable()
export class AiRepliesService {
  private readonly logger = new Logger(AiRepliesService.name);

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly homeData: HomeDataService,
  ) {}

  get available(): boolean {
    return this.client !== null;
  }

  get dailyLimit(): number {
    const n = Number(this.config.get('INBOX_AI_DAILY_LIMIT'));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
  }

  /** Everything the AI may state about the business. */
  async businessContext(vendorId: string): Promise<BusinessContext> {
    const [vendor] = await this.db
      .select({ businessName: vendors.businessName, category: vendors.category, description: vendors.description, address: vendors.address, slug: vendors.slug })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    const [serviceRows, hours, [settings]] = await Promise.all([
      this.db.select({ name: services.name, priceKobo: services.priceKobo, durationMinutes: services.durationMinutes })
        .from(services).where(eq(services.vendorId, vendorId)).orderBy(asc(services.name)).limit(60),
      this.db.select({ dayOfWeek: businessHours.dayOfWeek, opensAtMinutes: businessHours.opensAtMinutes, closesAtMinutes: businessHours.closesAtMinutes })
        .from(businessHours).where(eq(businessHours.vendorId, vendorId)),
      this.db.select({ faq: inboxSettings.faq }).from(inboxSettings).where(eq(inboxSettings.vendorId, vendorId)),
    ]);
    return {
      businessName: vendor.businessName, category: vendor.category, description: vendor.description, address: vendor.address,
      services: serviceRows, hours, bookingLink: this.homeData.bookingLinkFor(vendor.slug), faq: settings?.faq ?? [],
    };
  }

  /**
   * The AI's answer to a chat: a reply to send (or suggest), or a hand-off.
   * Null when the daily allowance is used up — the chat then waits for the vendor.
   */
  async reply(vendorId: string, req: ReplyRequest, now = new Date()): Promise<ReplyDecision | null> {
    const client = this.requireClient();
    if (!(await this.takeAllowance(vendorId, now))) {
      this.logger.warn(`Inbox AI daily limit reached for ${vendorId}`);
      return null;
    }
    const ctx = await this.businessContext(vendorId);
    const response = await client.beta.messages
      .parse({
        model: REPLY_MODEL,
        max_tokens: 4000,
        system: this.system(ctx),
        messages: [{ role: 'user', content: buildReplyPrompt(req.channel, req.customerName, req.transcript, req.adTitle) }],
        // Short replies from a fixed set of facts: low effort keeps them quick and cheap.
        output_config: { effort: 'low', format: betaZodOutputFormat(ReplyDraftSchema) },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      .catch(async (err: unknown): Promise<never> => {
        await this.giveBackAllowance(vendorId, now);
        throw this.toHttpError(err);
      });
    this.logger.debug(`Inbox AI usage: cache read ${response.usage.cache_read_input_tokens ?? 0}, write ${response.usage.cache_creation_input_tokens ?? 0}, input ${response.usage.input_tokens}`);

    // A refusal or a cut-off answer is never sent: the vendor takes the chat.
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens' || !response.parsed_output) {
      return { action: 'handoff', reason: 'unknown' };
    }
    return decideReply(response.parsed_output, { allowedAmountsKobo: allowedAmounts(ctx) });
  }

  /** A first FAQ for the vendor to edit, written from their profile, services and hours. Not saved. */
  async draftFaq(vendorId: string, now = new Date()): Promise<FaqEntry[]> {
    const client = this.requireClient();
    if (!(await this.takeAllowance(vendorId, now))) {
      throw new HttpException('You’ve used today’s AI allowance for the inbox. Try again tomorrow.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const ctx = await this.businessContext(vendorId);
    const response = await client.beta.messages
      .parse({
        model: REPLY_MODEL,
        max_tokens: 6000,
        system: this.system({ ...ctx, faq: [] }),
        messages: [{ role: 'user', content: FAQ_DRAFT_PROMPT }],
        output_config: { effort: 'low', format: betaZodOutputFormat(FaqDraftSchema) },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      .catch(async (err: unknown): Promise<never> => {
        await this.giveBackAllowance(vendorId, now);
        throw this.toHttpError(err);
      });
    const draft = response.parsed_output;
    if (!draft || response.stop_reason !== 'end_turn') throw new BadGatewayException('We couldn’t draft your FAQ just now. Please try again.');
    return draft.faq
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question && f.answer)
      .slice(0, 12);
  }

  /** [rules, business facts]; the breakpoint on the facts caches both as one prefix per business. */
  private system(ctx: BusinessContext): Anthropic.Beta.BetaTextBlockParam[] {
    return [
      { type: 'text', text: REPLY_RULES },
      { type: 'text', text: buildBusinessContext(ctx), cache_control: { type: 'ephemeral' } },
    ];
  }

  private requireClient(): Anthropic {
    if (!this.client) throw new ServiceUnavailableException('AI replies aren’t switched on yet.');
    return this.client;
  }

  private usageKey(vendorId: string, now: Date) {
    return `inbox:ai:${vendorId}:${now.toISOString().slice(0, 10)}`;
  }

  /** Counts the call before making it, so parallel calls can't overshoot the limit. */
  private async takeAllowance(vendorId: string, now: Date): Promise<boolean> {
    const key = this.usageKey(vendorId, now);
    const used = await this.redis.incr(key);
    if (used === 1) await this.redis.expire(key, 2 * 86_400);
    if (used > this.dailyLimit) {
      await this.redis.decr(key);
      return false;
    }
    return true;
  }

  private async giveBackAllowance(vendorId: string, now: Date) {
    await this.redis.decr(this.usageKey(vendorId, now));
  }

  private toHttpError(err: unknown): HttpException {
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError) {
      return new ServiceUnavailableException('The AI is busy. Please try again in a minute.');
    }
    if (err instanceof Anthropic.BadRequestError) this.logger.warn(`Inbox AI request rejected: ${err.message}`);
    else this.logger.error('Inbox AI request failed', err instanceof Error ? err.stack : String(err));
    return new BadGatewayException('The AI couldn’t answer just now. Please try again.');
  }
}
