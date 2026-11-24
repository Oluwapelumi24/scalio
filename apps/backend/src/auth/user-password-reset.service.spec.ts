import { sixDigitCode } from '../common/secure-code';
import { MAX_CODES_PER_HOUR, UserPasswordResetService } from './user-password-reset.service';

jest.mock('../common/secure-code', () => ({
  sixDigitCode: jest.fn(() => '424242'),
}));

function makeRedis(store: Map<string, string> = new Map()) {
  return {
    store,
    incr: jest.fn(),
    expire: jest.fn(async () => 1),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => {
      for (const k of keys) store.delete(k);
      return keys.length;
    }),
    eval: jest.fn(async (script: string, n: number, key: string) => {
      if (n === 1 && script.includes('INCR')) {
        const next = Number(store.get(key) ?? '0') + 1;
        store.set(key, String(next));
        return next;
      }
      return false;
    }),
  };
}

describe('UserPasswordResetService', () => {
  it('uses sixDigitCode and keeps tries across re-issue', async () => {
    const store = new Map<string, string>([['user-pw-reset:a@b.com:tries', '2']]);
    const redis = makeRedis(store);
    const svc = new UserPasswordResetService(redis as never);

    const code = await svc.issueCode('a@b.com', 'user-1');

    expect(sixDigitCode).toHaveBeenCalled();
    expect(code).toBe('424242');
    expect(store.get('user-pw-reset:a@b.com:tries')).toBe('2');
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('returns null after the hourly issue cap', async () => {
    const redis = makeRedis();
    redis.eval.mockResolvedValue(MAX_CODES_PER_HOUR + 1);
    const svc = new UserPasswordResetService(redis as never);
    await expect(svc.issueCode('a@b.com', 'user-1')).resolves.toBeNull();
    expect(redis.set).not.toHaveBeenCalled();
  });
});
