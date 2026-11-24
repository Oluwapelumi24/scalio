/** Origins allowed for browser CORS. Comma-separated `CORS_ORIGINS` in production. */
export function corsOriginsFromEnv(env: NodeJS.ProcessEnv = process.env): string[] | boolean {
  const configured = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (env.NODE_ENV === 'production') {
    return configured;
  }

  const local = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
  ];
  return [...new Set([...configured, ...local])];
}
