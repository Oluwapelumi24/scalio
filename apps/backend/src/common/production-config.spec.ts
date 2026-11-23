import { productionConfigProblems, REQUIRED_IN_PRODUCTION } from './production-config';

const secret = 'x'.repeat(40);
const complete: Record<string, string> = Object.fromEntries(
  REQUIRED_IN_PRODUCTION.map((name) => {
    if (name === 'PUBLIC_API_URL') return [name, 'https://api.venohq.com'];
    if (name === 'PUBLIC_BOOKING_URL') return [name, 'https://www.venohq.com/book'];
    if (name === 'VENDOR_WEB_URL') return [name, 'https://app.venohq.com'];
    if (name === 'RESEND_API_KEY') return [name, 're_test_key'];
    if (name === 'DATABASE_URL') return [name, 'postgresql://localhost/veno'];
    if (name === 'REDIS_URL') return [name, 'redis://localhost:6379'];
    return [name, secret];
  }),
);

describe('productionConfigProblems', () => {
  it('allows anything outside production', () => {
    expect(productionConfigProblems({ NODE_ENV: 'development' })).toEqual([]);
  });

  it('passes a complete production environment', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production', ...complete })).toEqual([]);
  });

  it('names every missing setting', () => {
    const problems = productionConfigProblems({
      NODE_ENV: 'production',
      ...complete,
      VENDOR_JWT_SECRET: '',
      REDIS_URL: undefined,
    });
    expect(problems).toEqual(['REDIS_URL is not set', 'VENDOR_JWT_SECRET is not set']);
  });

  it('rejects the development JWT secrets and short ones', () => {
    const problems = productionConfigProblems({
      NODE_ENV: 'production',
      ...complete,
      ADMIN_JWT_SECRET: 'dev-admin-jwt-secret',
      USER_JWT_SECRET: 'short',
    });
    expect(problems).toHaveLength(2);
  });

  it('rejects a fixed password-reset code', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production', ...complete, DEV_RESET_CODE: '111111' })).toEqual([
      'DEV_RESET_CODE must not be set in production',
    ]);
  });

  it('rejects non-https public URLs in production', () => {
    const problems = productionConfigProblems({
      NODE_ENV: 'production',
      ...complete,
      PUBLIC_API_URL: 'http://api.example.com',
    });
    expect(problems).toContain('PUBLIC_API_URL must be an https:// origin in production');
  });
});
