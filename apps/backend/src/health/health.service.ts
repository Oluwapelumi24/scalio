import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DB, type Database } from '../db/db.module';
import { REDIS } from '../redis/redis.module';

const CHECK_TIMEOUT_MS = 2000;

export type ProbeStatus = 'ok' | 'error';

@Injectable()
export class HealthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async check(): Promise<{ status: 'ok' | 'degraded'; db: ProbeStatus; redis: ProbeStatus }> {
    const [db, redis] = await Promise.all([this.probeDb(), this.probeRedis()]);
    const status = db === 'ok' && redis === 'ok' ? 'ok' : 'degraded';
    return { status, db, redis };
  }

  private async probeDb(): Promise<ProbeStatus> {
    try {
      await withTimeout(this.db.execute(sql`select 1`), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async probeRedis(): Promise<ProbeStatus> {
    try {
      const pong = await withTimeout(this.redis.ping(), CHECK_TIMEOUT_MS);
      return pong === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('health check timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
