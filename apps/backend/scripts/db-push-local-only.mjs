#!/usr/bin/env node
/**
 * Guarded wrapper around `drizzle-kit push`.
 * Refuses to run against production or any non-localhost DATABASE_URL.
 */
import { spawnSync } from 'node:child_process';

const nodeEnv = process.env.NODE_ENV ?? '';
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/veno';

if (nodeEnv === 'production') {
  console.error('db:push:local-only refused: NODE_ENV=production');
  process.exit(1);
}

let host = '';
try {
  host = new URL(databaseUrl).hostname;
} catch {
  console.error('db:push:local-only refused: DATABASE_URL is not a valid URL');
  process.exit(1);
}

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (!localHosts.has(host)) {
  console.error(
    `db:push:local-only refused: DATABASE_URL host is "${host}" (only localhost / 127.0.0.1 / ::1 allowed)`,
  );
  process.exit(1);
}

const result = spawnSync('npx', ['drizzle-kit', 'push'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
