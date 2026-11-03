import { productionConfigProblems, REQUIRED_IN_PRODUCTION } from './production-config';

const secret = 'x'.repeat(40);
const complete = Object.fromEntries(REQUIRED_IN_PRODUCTION.map((name) => [name, secret]));

describe('productionConfigProblems', () => {
  it('allows anything outside production', () => {
    expect(productionConfigProblems({ NODE_ENV: 'development' })).toEqual([]);
  });

  it('passes a complete production environment', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production', ...complete })).toEqual([]);
  });

  it('names every missing setting', () => {
    const problems = productionConfigProblems({ NODE_ENV: 'production', ...complete, VENDOR_JWT_SECRET: '', REDIS_URL: undefined });
    expect(problems).toEqual(['REDIS_URL is not set', 'VENDOR_JWT_SECRET is not set']);
  });

  it('rejects the development JWT secrets and short ones', () => {
    const problems = productionConfigProblems({ NODE_ENV: 'production', ...complete, ADMIN_JWT_SECRET: 'dev-admin-jwt-secret', USER_JWT_SECRET: 'short' });
    expect(problems).toHaveLength(2);
  });

  it('rejects a fixed password-reset code', () => {
    expect(productionConfigProblems({ NODE_ENV: 'production', ...complete, DEV_RESET_CODE: '111111' })).toEqual([
      'DEV_RESET_CODE must not be set in production',
    ]);
  });
});
