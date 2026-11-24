import { signupCodeResult } from '@veno/shared-types';
import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DB, type Database } from '../db/db.module';
import { staff } from '../db/schema';
import { MailService } from '../mail/mail.service';
import { REDIS } from '../redis/redis.module';

const CODE_TTL_SECONDS = 15 * 60;
const PROOF_TTL_SECONDS = 30 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_WRONG_ATTEMPTS = 5;

// 1 = match (code consumed). 0 = wrong guess. -1 = missing / already used / expired.
// Five wrong tries throw the code away so guessing cannot continue.
const CONSUME_CODE = `
local v = redis.call("get", KEYS[1])
if not v then return -1 end
if v == ARGV[1] then
  redis.call("del", KEYS[1], KEYS[2])
  return 1
end
local tries = redis.call("incr", KEYS[2])
redis.call("expire", KEYS[2], tonumber(ARGV[2]))
if tries >= tonumber(ARGV[3]) then redis.call("del", KEYS[1], KEYS[2]) end
return 0
`;

@Injectable()
export class VendorSignupCodeService {
  private readonly logger = new Logger(VendorSignupCodeService.name);

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(DB) private readonly db: Database,
    private readonly mail: MailService,
  ) {}

  async send(email: string): Promise<void> {
    const normalised = email.trim().toLowerCase();
    const [existing] = await this.db
      .select({ id: staff.id })
      .from(staff)
      .where(sql`lower(${staff.email}) = ${normalised}`);
    if (existing) {
      throw new ConflictException('This email already has a business on Veno. Sign in instead.');
    }

    const cooldown = `vendor-signup-cool:${normalised}`;
    const reserved = await this.redis.set(cooldown, '1', 'EX', RESEND_COOLDOWN_SECONDS, 'NX');
    if (reserved !== 'OK') {
      throw new BadRequestException('Wait a few seconds, then ask for another code.');
    }

    const code = randomInt(100000, 1000000).toString();
    const key = `vendor-signup:${normalised}`;
    await this.redis.multi().set(key, code, 'EX', CODE_TTL_SECONDS).del(`${key}:tries`).exec();

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Signup code for ${normalised} is ${code}`);
    }

    try {
      await this.mail.sendSignupCodeEmail(normalised, code);
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        await this.redis.del(key, cooldown);
        throw new BadRequestException('We could not send the code. Try again in a moment.');
      }
      this.logger.warn(`Signup email failed (${err instanceof Error ? err.message : String(err)}). The code is still valid in this environment.`);
    }
  }

  /** Returns a short-lived proof the register call must send back. */
  async verify(email: string, code: string): Promise<string> {
    const normalised = email.trim().toLowerCase();
    const key = `vendor-signup:${normalised}`;
    const result = await this.redis.eval(
      CONSUME_CODE,
      2,
      key,
      `${key}:tries`,
      code.trim(),
      String(CODE_TTL_SECONDS),
      String(MAX_WRONG_ATTEMPTS),
    );
    const outcome = signupCodeResult(Number(result));
    if (outcome === 'expired') {
      throw new BadRequestException('That code has expired. Request a new one.');
    }
    if (outcome === 'wrong') {
      throw new BadRequestException('That code is wrong. Use the latest email we sent.');
    }

    const proof = randomBytes(24).toString('hex');
    await this.redis.set(`vendor-signup-proof:${normalised}`, proof, 'EX', PROOF_TTL_SECONDS);
    return proof;
  }

  async consumeProof(email: string, proof: string): Promise<void> {
    const normalised = email.trim().toLowerCase();
    const key = `vendor-signup-proof:${normalised}`;
    const stored = await this.redis.get(key);
    if (!stored || stored !== proof) {
      throw new BadRequestException('Verify your email before creating the business.');
    }
    await this.redis.del(key);
  }
}
