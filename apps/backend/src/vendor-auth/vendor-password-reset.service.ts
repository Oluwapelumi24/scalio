import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const RESET_CODE_TTL_SECONDS = 15 * 60;
/** Wrong guesses allowed before the code is thrown away (a 6-digit code can't be brute-forced in 5). */
export const MAX_WRONG_CODE_ATTEMPTS = 5;

// Atomic check: on a match, delete the code and return the staff id. On a miss,
// count the attempt and throw the code away once the limit is reached — so one
// typo doesn't cost the person their code, but guessing still can't work.
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
export class VendorPasswordResetService {
  private readonly logger = new Logger(VendorPasswordResetService.name);
  /**
   * Test environments only (local / UAT): a fixed code that resets any vendor
   * account without email. The server refuses to start with it in production.
   */
  private readonly devCode: string | null;

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    config: ConfigService,
  ) {
    const devCode = config.get<string>('DEV_RESET_CODE')?.trim() || null;
    if (devCode && config.get<string>('NODE_ENV') === 'production') {
      throw new Error('DEV_RESET_CODE must not be set in production — it lets anyone reset any vendor password.');
    }
    if (devCode && !/^\d{6}$/.test(devCode)) throw new Error('DEV_RESET_CODE must be 6 digits.');
    this.devCode = devCode;
    if (devCode) this.logger.warn('DEV_RESET_CODE is on: any vendor password can be reset with the fixed test code.');
  }

  private buildKey(email: string): string {
    return `vendor-pw-reset:${email.toLowerCase()}`;
  }

  /** Mints a 6-digit reset code bound to an email, valid for 15 minutes. */
  async issueCode(email: string, staffId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.buildKey(email);
    await this.redis.multi().set(key, `${staffId}:${code}`, 'EX', RESET_CODE_TTL_SECONDS).del(`${key}:tries`).exec();
    return code;
  }

  /** True when `code` is the test-environment code (only ever when DEV_RESET_CODE is set). */
  isDevCode(code: string): boolean {
    if (!this.devCode || code !== this.devCode) return false;
    this.logger.warn('Password reset with DEV_RESET_CODE.');
    return true;
  }

  /** Validates and consumes the code. Returns staffId on success, null on invalid/expired. */
  async consumeCode(email: string, code: string): Promise<string | null> {
    const key = this.buildKey(email);
    const result = await this.redis.eval(CONSUME_CODE_SCRIPT, 2, key, `${key}:tries`, code, String(RESET_CODE_TTL_SECONDS), String(MAX_WRONG_CODE_ATTEMPTS));
    return typeof result === 'string' ? result : null;
  }
}
