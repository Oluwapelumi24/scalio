import { VendorPasswordResetService } from './vendor-password-reset.service';

const config = (values: Record<string, string | undefined>) => ({ get: (k: string) => values[k] });
const redis = {} as never;

describe('VendorPasswordResetService — DEV_RESET_CODE', () => {
  it('is off unless configured', () => {
    expect(new VendorPasswordResetService(redis, config({}) as never).isDevCode('111111')).toBe(false);
  });

  it('accepts only the configured code', () => {
    const svc = new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: '111111' }) as never);
    expect(svc.isDevCode('111111')).toBe(true);
    expect(svc.isDevCode('111112')).toBe(false);
  });

  it('refuses to start in production', () => {
    expect(() => new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: '111111', NODE_ENV: 'production' }) as never)).toThrow(/must not be set in production/);
  });

  it('must be 6 digits', () => {
    expect(() => new VendorPasswordResetService(redis, config({ DEV_RESET_CODE: 'abc' }) as never)).toThrow(/6 digits/);
  });
});
