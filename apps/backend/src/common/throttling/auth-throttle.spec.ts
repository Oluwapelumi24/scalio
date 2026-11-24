import { Controller, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import request from 'supertest';
import { LoginThrottle, emailTracker, skipUnlessApplied } from './apply-throttlers';

@Controller('test-auth')
class TestAuthController {
  @Post('login')
  @LoginThrottle()
  login() {
    return { ok: true };
  }

  @Post('open')
  open() {
    return { ok: true };
  }
}

/** In-memory throttler storage for tests (no Redis). */
class MemoryThrottlerStorage {
  private readonly hits = new Map<string, { totalHits: number; expiresAt: number; isBlocked: boolean; blockExpiresAt: number }>();

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const now = Date.now();
    let current = this.hits.get(key);
    if (!current || current.expiresAt <= now) {
      current = { totalHits: 0, expiresAt: now + ttl, isBlocked: false, blockExpiresAt: 0 };
      this.hits.set(key, current);
    }
    if (current.isBlocked && current.blockExpiresAt > now) {
      return {
        totalHits: current.totalHits,
        timeToExpire: Math.max(0, current.expiresAt - now),
        isBlocked: true,
        timeToBlockExpire: current.blockExpiresAt - now,
      };
    }
    current.totalHits += 1;
    if (current.totalHits > limit) {
      current.isBlocked = true;
      current.blockExpiresAt = now + blockDuration;
    }
    return {
      totalHits: current.totalHits,
      timeToExpire: Math.max(0, current.expiresAt - now),
      isBlocked: current.isBlocked,
      timeToBlockExpire: Math.max(0, current.blockExpiresAt - now),
    };
  }
}

describe('auth throttling', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            { name: 'default', ttl: minutes(1), limit: 300 },
            {
              name: 'authLoginIp',
              ttl: minutes(1),
              limit: 10,
              skipIf: skipUnlessApplied('authLoginIp'),
            },
            {
              name: 'authLoginEmail',
              ttl: minutes(1),
              limit: 5,
              skipIf: skipUnlessApplied('authLoginEmail'),
              getTracker: emailTracker,
            },
          ],
          storage: new MemoryThrottlerStorage() as never,
        }),
      ],
      controllers: [TestAuthController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 after the per-email login limit', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 5; i++) {
      await request(server).post('/test-auth/login').send({ email: 'hit@test.com' }).expect(201);
    }
    await request(server).post('/test-auth/login').send({ email: 'hit@test.com' }).expect(429);
  });

  it('does not apply login throttles to undecorated routes', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 6; i++) {
      await request(server).post('/test-auth/open').send({ email: 'hit@test.com' }).expect(201);
    }
  });
});
