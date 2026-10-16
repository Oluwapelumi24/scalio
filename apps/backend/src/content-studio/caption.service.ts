import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import {
  BadGatewayException, HttpException, HttpStatus, Inject, Injectable, Logger, ServiceUnavailableException, UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { CAPTION_SYSTEM_PROMPT, CaptionDraftSchema, buildCaptionPrompt, type CaptionContext, type CaptionDraft } from './caption-writer';
import { cleanHashtags } from './platforms';

/** Null when ANTHROPIC_API_KEY isn't set — AI captions are then switched off, not broken. */
export const ANTHROPIC_CLIENT = Symbol('ANTHROPIC_CLIENT');

export const CAPTION_MODEL = 'claude-opus-5-5';
const DEFAULT_DAILY_LIMIT = 40;

export interface CaptionImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  dataBase64: string;
}

/** Writes captions with Claude. Runs only on the backend; the API key never reaches the apps. */
@Injectable()
export class CaptionService {
  private readonly logger = new Logger(CaptionService.name);

  constructor(
    @Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  get available(): boolean {
    return this.client !== null;
  }

  get dailyLimit(): number {
    const n = Number(this.config.get('CONTENT_AI_DAILY_LIMIT'));
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
  }

  private usageKey(vendorId: string, now: Date) {
    return `content:ai:${vendorId}:${now.toISOString().slice(0, 10)}`;
  }

  async usedToday(vendorId: string, now = new Date()): Promise<number> {
    return Number((await this.redis.get(this.usageKey(vendorId, now))) ?? 0);
  }

  async write(vendorId: string, ctx: CaptionContext, image: CaptionImage | null, now = new Date()): Promise<CaptionDraft> {
    if (!this.client) {
      throw new ServiceUnavailableException("AI captions aren't switched on yet. You can still write your own caption.");
    }

    // Count the attempt before calling Claude, so parallel requests can't overshoot the limit.
    const key = this.usageKey(vendorId, now);
    const used = await this.redis.incr(key);
    if (used === 1) await this.redis.expire(key, 2 * 86_400);
    if (used > this.dailyLimit) {
      throw new HttpException(`You've used today's ${this.dailyLimit} AI captions. You can write your own, or try again tomorrow.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.dataBase64 } });
    content.push({ type: 'text', text: buildCaptionPrompt({ ...ctx, hasImage: !!image }) });

    const response = await this.client.beta.messages
      .parse({
        model: CAPTION_MODEL,
        max_tokens: 4000,
        system: CAPTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
        // A short, well-specified writing task: low effort keeps it quick and cheap.
        output_config: { effort: 'low', format: betaZodOutputFormat(CaptionDraftSchema) },
        // If the model declines, the API retries on a fallback model in the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      .catch(async (err: unknown): Promise<never> => {
        await this.redis.decr(key); // a failed call shouldn't use up the allowance
        throw this.toHttpError(err);
      });

    if (response.stop_reason === 'refusal') {
      throw new UnprocessableEntityException("We couldn't write a caption for this. Try describing the post differently.");
    }
    const draft = response.parsed_output;
    if (!draft || response.stop_reason === 'max_tokens') {
      throw new BadGatewayException("We couldn't write a caption just now. Please try again.");
    }
    return {
      caption: draft.caption.trim(),
      hashtags: cleanHashtags(draft.hashtags).slice(0, 30),
      callToAction: draft.callToAction.trim(),
    };
  }

  private toHttpError(err: unknown): HttpException {
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError) {
      return new ServiceUnavailableException('The caption writer is busy. Please try again in a minute.');
    }
    if (err instanceof Anthropic.BadRequestError) {
      this.logger.warn(`Caption request rejected: ${err.message}`);
      return new UnprocessableEntityException("We couldn't use that photo. Try a different one, or write without a photo.");
    }
    this.logger.error('Caption request failed', err instanceof Error ? err.stack : String(err));
    return new BadGatewayException("We couldn't write a caption just now. Please try again.");
  }
}
