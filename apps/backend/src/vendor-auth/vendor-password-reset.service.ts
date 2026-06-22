import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const RESET_CODE_TTL_SECONDS = 15 * 60;

const CONSUME_CODE_SCRIPT = `
local staffId = redis.call("get", KEYS[1])
if staffId then
  redis.call("del", KEYS[1])
  return staffId
else
  return false
end
`;

@Injectable()
export class VendorPasswordResetService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private buildKey(email: string): string {
    return `vendor-pw-reset:${email.toLowerCase()}`;
  }

  /** Mints a 6-digit reset code bound to an email, valid for 15 minutes. */
  async issueCode(email: string, staffId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(this.buildKey(email), `${staffId}:${code}`, 'EX', RESET_CODE_TTL_SECONDS);
    return code;
  }

  /** Validates and consumes the code. Returns staffId on success, null on invalid/expired. */
  async consumeCode(email: string, code: string): Promise<string | null> {
    const result = await this.redis.eval(CONSUME_CODE_SCRIPT, 1, this.buildKey(email));
    if (typeof result !== 'string') return null;
    const [staffId, storedCode] = result.split(':');
    return storedCode === code ? staffId : null;
  }
}
