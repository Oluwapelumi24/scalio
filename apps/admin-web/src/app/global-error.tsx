'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Something went wrong</h1>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
