import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';

const ADMIN_INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;

const CONSUME_TOKEN_SCRIPT = `
local adminId = redis.call("get", KEYS[1])
if adminId then
  redis.call("del", KEYS[1])
  return adminId
else
  return false
end
`;

@Injectable()
export class AdminInviteService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  buildKey(token: string): string {
    return `admin-invite:${token}`;
  }

  async issueToken(adminId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(this.buildKey(token), adminId, 'EX', ADMIN_INVITE_TTL_SECONDS);
    return token;
  }

  async consumeToken(token: string): Promise<string | null> {
    const result = await this.redis.eval(CONSUME_TOKEN_SCRIPT, 1, this.buildKey(token));
    return typeof result === 'string' ? result : null;
  }
}
