// Settings that have a development fallback in code. In production a missing
// value would silently use the public fallback (e.g. anyone could sign tokens
// with 'dev-vendor-jwt-secret'), so the server refuses to start instead.
export const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'REDIS_URL',
  'USER_JWT_SECRET',
  'VENDOR_JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'PII_ENCRYPTION_KEY',
  'MEDIA_URL_SECRET',
  // Signup / reset email and public marketplace URLs — required for go-live.
  'RESEND_API_KEY',
  'PUBLIC_API_URL',
  'PUBLIC_BOOKING_URL',
  'VENDOR_WEB_URL',
  // Admin invite emails build /accept-invite links from this origin.
  'ADMIN_WEB_URL',
  // Shared secret so Next server actions can forward the real client IP for rate limits.
  'INTERNAL_PROXY_SECRET',
  // Online bookings / webhooks — without this, Paystack charges cannot be verified.
  'PAYSTACK_SECRET_KEY',
] as const;

/** Returns what's wrong with the environment; empty when it's fine to start. */
export function productionConfigProblems(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const problems = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]?.trim()).map((name) => `${name} is not set`);
  for (const name of ['USER_JWT_SECRET', 'VENDOR_JWT_SECRET', 'ADMIN_JWT_SECRET', 'INTERNAL_PROXY_SECRET'] as const) {
    const value = env[name]?.trim();
    if (value && (value.startsWith('dev-') || value.length < 32)) {
      problems.push(`${name} must be a random value of at least 32 characters`);
    }
  }
  if (env.DEV_RESET_CODE) problems.push('DEV_RESET_CODE must not be set in production');

  const publicApi = env.PUBLIC_API_URL?.trim();
  if (publicApi && !/^https:\/\//i.test(publicApi)) {
    problems.push('PUBLIC_API_URL must be an https:// origin in production');
  }
  const booking = env.PUBLIC_BOOKING_URL?.trim();
  if (booking && !/^https:\/\//i.test(booking)) {
    problems.push('PUBLIC_BOOKING_URL must be an https:// URL in production');
  }
  const vendorWeb = env.VENDOR_WEB_URL?.trim();
  if (vendorWeb && !/^https:\/\//i.test(vendorWeb)) {
    problems.push('VENDOR_WEB_URL must be an https:// origin in production');
  }
  const adminWeb = env.ADMIN_WEB_URL?.trim();
  if (adminWeb && !/^https:\/\//i.test(adminWeb)) {
    problems.push('ADMIN_WEB_URL must be an https:// origin in production');
  }

  return problems;
}
