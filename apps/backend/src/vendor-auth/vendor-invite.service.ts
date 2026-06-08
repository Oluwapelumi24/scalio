import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

// Invites are platform-provisioned (no public vendor signup), so the link
// just needs to outlive a slow inbox check — a week is generous without
// leaving stale, claimable tokens around indefinitely.
export const VENDOR_INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;

// Atomic get-and-delete (mirrors OtpService's compare-and-delete): a token
// can only ever be claimed once, so a replayed link never re-grants access.
const CONSUME_TOKEN_SCRIPT = `
local staffId = redis.call("get", KEYS[1])
if staffId then
  redis.call("del", KEYS[1])
  return staffId
else
  return false
end
`;

@Injectable()
export class VendorInviteService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  buildKey(token: string): string {
    return `vendor-invite:${token}`;
  }

  /** Mints a single-use, time-limited token bound to a staff record. */
  async issueToken(staffId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(
      this.buildKey(token),
      staffId,
      'EX',
      VENDOR_INVITE_TTL_SECONDS,
    );
    return token;
  }

  /** Resolves and consumes a token, returning the bound staff id or null if invalid/expired/already used. */
  async consumeToken(token: string): Promise<string | null> {
    const result = await this.redis.eval(
      CONSUME_TOKEN_SCRIPT,
      1,
      this.buildKey(token),
    );
    return typeof result === 'string' ? result : null;
  }
}
