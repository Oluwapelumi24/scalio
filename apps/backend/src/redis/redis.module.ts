import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        // family 0 resolves both IPv4 and IPv6; Railway's private network is IPv6-only.
        return new Redis(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', { family: 0 });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
