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
] as const;

/** Returns what's wrong with the environment; empty when it's fine to start. */
export function productionConfigProblems(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const problems = REQUIRED_IN_PRODUCTION.filter((name) => !env[name]?.trim()).map((name) => `${name} is not set`);
  for (const name of ['USER_JWT_SECRET', 'VENDOR_JWT_SECRET', 'ADMIN_JWT_SECRET'] as const) {
    const value = env[name]?.trim();
    if (value && (value.startsWith('dev-') || value.length < 32)) problems.push(`${name} must be a random value of at least 32 characters`);
  }
  if (env.DEV_RESET_CODE) problems.push('DEV_RESET_CODE must not be set in production');
  return problems;
}
