import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok when db and redis respond', async () => {
    const db = { execute: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const result = await new HealthService(db as never, redis as never).check();
    expect(result).toEqual({ status: 'ok', db: 'ok', redis: 'ok' });
  });

  it('returns degraded when db fails', async () => {
    const db = { execute: jest.fn().mockRejectedValue(new Error('db down')) };
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const result = await new HealthService(db as never, redis as never).check();
    expect(result).toEqual({ status: 'degraded', db: 'error', redis: 'ok' });
  });

  it('returns degraded when redis fails', async () => {
    const db = { execute: jest.fn().mockResolvedValue([]) };
    const redis = { ping: jest.fn().mockRejectedValue(new Error('redis down')) };
    const result = await new HealthService(db as never, redis as never).check();
    expect(result).toEqual({ status: 'degraded', db: 'ok', redis: 'error' });
  });

  it('treats a slow probe as error', async () => {
    jest.useFakeTimers();
    const db = {
      execute: jest.fn(
        () =>
          new Promise(() => {
            /* never resolves */
          }),
      ),
    };
    const redis = { ping: jest.fn().mockResolvedValue('PONG') };
    const pending = new HealthService(db as never, redis as never).check();
    await jest.advanceTimersByTimeAsync(2100);
    await expect(pending).resolves.toEqual({ status: 'degraded', db: 'error', redis: 'ok' });
    jest.useRealTimers();
  });
});
