#!/usr/bin/env node
/**
 * Runs Drizzle SQL migrations from apps/backend/drizzle.
 * Uses DATABASE_URL. Safe to run in prod once the human has reconciled history
 * (see drizzle/AUDIT.md) — do NOT wire this into railway.json until then.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('db:migrate refused: DATABASE_URL is not set');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(here, '..', 'drizzle');

const pool = new pg.Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

try {
  console.log(`Migrating from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log('Migrations complete');
} finally {
  await pool.end();
}
