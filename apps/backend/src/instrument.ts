import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          if (/^(authorization|cookie|x-api-key)$/i.test(key)) {
            headers[key] = '[Filtered]';
          }
        }
        event.request.headers = headers;
      }
      const scrub = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(scrub);
        if (value && typeof value === 'object') {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (/password|token|secret|code|authorization|account.?number|bank/i.test(k)) {
              out[k] = '[Filtered]';
            } else {
              out[k] = scrub(v);
            }
          }
          return out;
        }
        return value;
      };
      if (event.request?.data) event.request.data = scrub(event.request.data);
      if (event.extra) event.extra = scrub(event.extra) as typeof event.extra;
      return event;
    },
  });
}
