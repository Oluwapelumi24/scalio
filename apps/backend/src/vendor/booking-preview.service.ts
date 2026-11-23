import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const PREVIEW_TTL_SECONDS = 30 * 60;

/**
 * Lets a signed-in staff member open `/book/:slug` for a business that is still
 * in review. The token is bound to that slug and short-lived; without it the
 * public profile stays 404 until approval.
 */
@Injectable()
export class BookingPreviewService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async issue(slug: string): Promise<string> {
    const token = randomBytes(24).toString('hex');
    await this.redis.set(this.key(token), slug, 'EX', PREVIEW_TTL_SECONDS);
    return token;
  }

  async matches(token: string, slug: string): Promise<boolean> {
    const cleaned = token.trim().toLowerCase();
    if (!/^[0-9a-f]{32,64}$/.test(cleaned)) return false;
    const stored = await this.redis.get(this.key(cleaned));
    return stored === slug;
  }

  private key(token: string) {
    return `vendor-booking-preview:${token}`;
  }
}
