import { Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { MailService } from '../mail/mail.service';

// PRD §4.1 step 7: email is verified at booking time. 10 minutes mirrors the
// slot-lock hold so a code never outlives the booking attempt it gates.
export const OTP_TTL_SECONDS = 10 * 60;

// Atomic compare-and-delete (mirrors SlotLockService's release script): a
// code can only ever be consumed once, and a stale code never matches a
// freshly-requested one.
const VERIFY_AND_CONSUME_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  redis.call("del", KEYS[1])
  return 1
else
  return 0
end
`;

@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly mail: MailService,
  ) {}

  buildKey(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  /** Generates a 6-digit code, stores it for OTP_TTL_SECONDS, and emails it to the user. */
  async requestCode(email: string): Promise<void> {
    const code = randomInt(100_000, 1_000_000).toString();
    await this.redis.set(this.buildKey(email), code, 'EX', OTP_TTL_SECONDS);
    await this.mail.sendOtpEmail(email, code);
  }

  /** Verifies and consumes the code in one step — a code can only ever be used once. */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const result = await this.redis.eval(
      VERIFY_AND_CONSUME_SCRIPT,
      1,
      this.buildKey(email),
      code,
    );
    return result === 1;
  }
}
