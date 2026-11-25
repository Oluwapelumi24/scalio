import { corsOriginsFromEnv } from './cors';

describe('corsOriginsFromEnv', () => {
  it('returns only configured origins in production', () => {
    expect(
      corsOriginsFromEnv({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.venohq.com, https://www.venohq.com',
      }),
    ).toEqual(['https://app.venohq.com', 'https://www.venohq.com']);
  });

  it('includes localhost in non-production', () => {
    const origins = corsOriginsFromEnv({
      NODE_ENV: 'development',
      CORS_ORIGINS: 'https://preview.example.com',
    }) as string[];
    expect(origins).toContain('https://preview.example.com');
    expect(origins).toContain('http://localhost:3001');
  });
});
