import { sixDigitCode } from '../common/secure-code';
import {
  MAX_CODES_PER_HOUR,
  MAX_WRONG_CODE_ATTEMPTS,
  VendorPasswordResetService,
} from './vendor-password-reset.service';

jest.mock('../common/secure-code', () => ({
  sixDigitCode: jest.fn(() => '424242'),
}));

const config = (values: Record<string, string | undefined>) => ({ get: (k: string) => values[k] });

function makeRedis(store: Map<string, string> = new Map()) {
  const ttls = new Map<string, number>();
  return {
    store,
    ttls,
    incr: jest.fn(async (key: string) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      ttls.set(key, seconds);
      return 1;
    }),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (...keys: string[]) => {
      for (const k of keys) store.delete(k);
      return keys.length;
    }),
    eval: jest.fn(async (_script: string, _n: number, key: string, triesKey: string, code: string) => {
      const v = store.get(key);
      if (!v) return false;
      const sep = v.indexOf(':');
      const staffId = v.slice(0, sep);
      const stored = v.slice(sep + 1);
      if (stored === code) {
        store.delete(key);
        store.delete(triesKey);
        return staffId;
      }
      const tries = Number(store.get(triesKey) ?? '0') + 1;
      store.set(triesKey, String(tries));
      if (tries >= MAX_WRONG_CODE_ATTEMPTS) {
        store.delete(key);
        store.delete(triesKey);
      }
      return false;
    }),
  };
}

describe('VendorPasswordResetService — DEV_RESET_CODE', () => {
  const redis = makeRedis() as never;

  it('is off unless configured', () => {
    expect(new VendorPasswordResetService(redis, config({}) as never).isDevCode('111111')).toBe(false);
  });

  it('accepts only the configured code', () => {
    const svc = new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: '111111' }) as never);
    expect(svc.isDevCode('111111')).toBe(true);
    expect(svc.isDevCode('111112')).toBe(false);
  });

  it('refuses to start in production', () => {
    expect(() => new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: '111111', NODE_ENV: 'production' }) as never)).toThrow(
      /must not be set in production/,
    );
  });

  it('must be 6 digits', () => {
    expect(() => new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: 'abc' }) as never)).toThrow(/6 digits/);
  });
});

describe('VendorPasswordResetService — issueCode', () => {
  it('uses sixDigitCode (crypto.randomInt) for the code', async () => {
    const redis = makeRedis();
    const svc = new VendorPasswordResetService(redis as never, config({}) as never);

    const code = await svc.issueCode('a@b.com', 'staff-1');

    expect(sixDigitCode).toHaveBeenCalled();
    expect(code).toBe('424242');
    expect(redis.set).toHaveBeenCalledWith('vendor-pw-reset:a@b.com', 'staff-1:424242', 'EX', 15 * 60);
  });

  it('keeps the tries counter across re-issues', async () => {
    const store = new Map<string, string>([['vendor-pw-reset:a@b.com:tries', '3']]);
    const redis = makeRedis(store);
    const svc = new VendorPasswordResetService(redis as never, config({}) as never);

    await svc.issueCode('a@b.com', 'staff-1');

    expect(store.get('vendor-pw-reset:a@b.com:tries')).toBe('3');
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('silently returns null after the hourly issue cap', async () => {
    const redis = makeRedis();
    redis.incr.mockResolvedValue(MAX_CODES_PER_HOUR + 1);
    const svc = new VendorPasswordResetService(redis as never, config({}) as never);

    await expect(svc.issueCode('a@b.com', 'staff-1')).resolves.toBeNull();
    expect(redis.set).not.toHaveBeenCalled();
  });
});
