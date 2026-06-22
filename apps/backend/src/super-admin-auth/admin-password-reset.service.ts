import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const RESET_CODE_TTL_SECONDS = 15 * 60;

const CONSUME_CODE_SCRIPT = `
local val = redis.call("get", KEYS[1])
if val then
  redis.call("del", KEYS[1])
  return val
else
  return false
end
`;

@Injectable()
export class AdminPasswordResetService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private buildKey(email: string): string {
    return `admin-pw-reset:${email.toLowerCase()}`;
  }

  async issueCode(email: string, adminId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(this.buildKey(email), `${adminId}:${code}`, 'EX', RESET_CODE_TTL_SECONDS);
    return code;
  }

  async consumeCode(email: string, code: string): Promise<string | null> {
    const result = await this.redis.eval(CONSUME_CODE_SCRIPT, 1, this.buildKey(email));
    if (typeof result !== 'string') return null;
    const [adminId, storedCode] = result.split(':');
    return storedCode === code ? adminId : null;
  }
}
