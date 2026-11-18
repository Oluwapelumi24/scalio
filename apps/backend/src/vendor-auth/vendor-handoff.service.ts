import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const HANDOFF_TTL_SECONDS = 90;

const CONSUME = `
local v = redis.call("get", KEYS[1])
if not v then return false end
redis.call("del", KEYS[1])
return v
`;

/**
 * Moves a signed-in vendor from the marketing site onto the dashboard without
 * putting the long-lived JWT in the address bar. The code is single-use and
 * short-lived.
 */
@Injectable()
export class VendorHandoffService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async issue(staffId: string): Promise<string> {
    const code = randomBytes(24).toString('hex');
    await this.redis.set(this.key(code), staffId, 'EX', HANDOFF_TTL_SECONDS);
    return code;
  }

  async consume(code: string): Promise<string> {
    const cleaned = code.trim().toLowerCase();
    if (!/^[0-9a-f]{32,64}$/.test(cleaned)) {
      throw new BadRequestException('This link has expired. Sign in again.');
    }
    const staffId = await this.redis.eval(CONSUME, 1, this.key(cleaned));
    if (typeof staffId !== 'string' || !staffId) {
      throw new BadRequestException('This link has expired. Sign in again.');
    }
    return staffId;
  }

  private key(code: string) {
    return `vendor-handoff:${code}`;
  }
}
