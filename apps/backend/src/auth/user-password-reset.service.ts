import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { sixDigitCode } from '../common/secure-code';
import { REDIS } from '../redis/redis.module';

const RESET_CODE_TTL_SECONDS = 15 * 60;
export const MAX_WRONG_CODE_ATTEMPTS = 5;
export const MAX_CODES_PER_HOUR = 5;
const ISSUE_WINDOW_SECONDS = 60 * 60;

const CONSUME_CODE_SCRIPT = `
local v = redis.call("get", KEYS[1])
if not v then return false end
local sep = string.find(v, ":", 1, true)
if string.sub(v, sep + 1) == ARGV[1] then
  redis.call("del", KEYS[1], KEYS[2])
  return string.sub(v, 1, sep - 1)
end
local tries = redis.call("incr", KEYS[2])
redis.call("expire", KEYS[2], tonumber(ARGV[2]))
if tries >= tonumber(ARGV[3]) then redis.call("del", KEYS[1], KEYS[2]) end
return false
`;

@Injectable()
export class UserPasswordResetService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private buildKey(email: string): string {
    return `user-pw-reset:${email.toLowerCase()}`;
  }

  /** Returns null when the hourly issue cap is exceeded (caller still 204s). */
  async issueCode(email: string, userId: string): Promise<string | null> {
    const key = this.buildKey(email);
    const issuedKey = `${key}:issued`;
    const issued = await this.redis.incr(issuedKey);
    if (issued === 1) await this.redis.expire(issuedKey, ISSUE_WINDOW_SECONDS);
    if (issued > MAX_CODES_PER_HOUR) return null;

    const code = sixDigitCode();
    await this.redis.set(key, `${userId}:${code}`, 'EX', RESET_CODE_TTL_SECONDS);
    return code;
  }

  async consumeCode(email: string, code: string): Promise<string | null> {
    const key = this.buildKey(email);
    const result = await this.redis.eval(
      CONSUME_CODE_SCRIPT,
      2,
      key,
      `${key}:tries`,
      code,
      String(RESET_CODE_TTL_SECONDS),
      String(MAX_WRONG_CODE_ATTEMPTS),
    );
    return typeof result === 'string' ? result : null;
  }
}
