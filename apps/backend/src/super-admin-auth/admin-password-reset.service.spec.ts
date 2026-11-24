import { sixDigitCode } from '../common/secure-code';
import { MAX_CODES_PER_HOUR, AdminPasswordResetService } from './admin-password-reset.service';

jest.mock('../common/secure-code', () => ({
  sixDigitCode: jest.fn(() => '555555'),
}));

function makeRedis(store: Map<string, string> = new Map()) {
  return {
    store,
    incr: jest.fn(async (key: string) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    }),
    expire: jest.fn(async () => 1),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => {
      for (const k of keys) store.delete(k);
      return keys.length;
    }),
  };
}

describe('AdminPasswordResetService', () => {
  it('uses sixDigitCode (crypto.randomInt) for the code', async () => {
    const redis = makeRedis();
    const svc = new AdminPasswordResetService(redis as never);

    const code = await svc.issueCode('admin@veno.test', 'admin-1');

    expect(sixDigitCode).toHaveBeenCalled();
    expect(code).toBe('555555');
  });

  it('keeps the tries counter across re-issues', async () => {
    const store = new Map<string, string>([['admin-pw-reset:admin@veno.test:tries', '2']]);
    const redis = makeRedis(store);
    const svc = new AdminPasswordResetService(redis as never);

    await svc.issueCode('admin@veno.test', 'admin-1');

    expect(store.get('admin-pw-reset:admin@veno.test:tries')).toBe('2');
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('silently returns null after the hourly issue cap', async () => {
    const redis = makeRedis();
    redis.incr.mockResolvedValue(MAX_CODES_PER_HOUR + 1);
    const svc = new AdminPasswordResetService(redis as never);

    await expect(svc.issueCode('admin@veno.test', 'admin-1')).resolves.toBeNull();
    expect(redis.set).not.toHaveBeenCalled();
  });
});
