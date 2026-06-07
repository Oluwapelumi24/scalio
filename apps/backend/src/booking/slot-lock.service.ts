import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

export const SLOT_LOCK_TTL_SECONDS = 10 * 60; // PRD §9.3: 10-minute hold during payment

// Compare-and-delete so a service only releases the lock it owns — prevents
// a slow request from releasing a lock another request has since acquired
// for the same slot after the first one expired.
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export interface SlotLockHandle {
  key: string;
  token: string;
}

@Injectable()
export class SlotLockService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  buildKey(vendorId: string, staffId: string | 'any', isoMinute: string): string {
    return `slot:${vendorId}:${staffId}:${isoMinute}`;
  }

  /** Returns a lock handle if acquired, or null if the slot is already held. */
  async acquire(key: string): Promise<SlotLockHandle | null> {
    const token = randomUUID();
    const result = await this.redis.set(key, token, 'EX', SLOT_LOCK_TTL_SECONDS, 'NX');
    return result === 'OK' ? { key, token } : null;
  }

  /** Releases the lock only if it's still held by this handle's token. */
  async release(handle: SlotLockHandle): Promise<void> {
    await this.redis.eval(RELEASE_SCRIPT, 1, handle.key, handle.token);
  }
}
