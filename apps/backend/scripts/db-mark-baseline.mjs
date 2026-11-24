#!/usr/bin/env node
/**
 * Prints (or applies) SQL that marks the baseline migration as already applied
 * WITHOUT running the baseline CREATE TABLEs.
 *
 * Drizzle's node-postgres migrator stores history in
 *   drizzle.__drizzle_migrations
 * (schema "drizzle"), not public.__drizzle_migrations.
 *
 * Dry-run by default. To apply:
 *   DATABASE_URL=… node scripts/db-mark-baseline.mjs --apply --i-have-a-backup
 *
 * See drizzle/AUDIT.md.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repairDir = join(here, '..', 'drizzle', 'repair');
const journalPath = join(repairDir, '_journal.baseline.json');
const apply = process.argv.includes('--apply');
const confirmedBackup = process.argv.includes('--i-have-a-backup');

if (!existsSync(journalPath)) {
  console.error(`Missing ${journalPath}`);
  process.exit(1);
}

const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
const entry = journal.entries?.[0];
if (!entry?.tag || entry.when == null) {
  console.error('Baseline journal must have entries[0].tag and entries[0].when');
  process.exit(1);
}

const sqlPath = join(repairDir, `${entry.tag}.sql`);
const installedPath = join(here, '..', 'drizzle', `${entry.tag}.sql`);
const baselinePath = existsSync(installedPath) ? installedPath : sqlPath;
if (!existsSync(baselinePath)) {
  console.error(`Baseline SQL not found at ${sqlPath} or ${installedPath}`);
  process.exit(1);
}

// Must match drizzle-orm/migrator.js readMigrationFiles: sha256 of the raw file bytes.
const query = readFileSync(baselinePath);
const hash = createHash('sha256').update(query).digest('hex');
const createdAt = Number(entry.when);

const sql = `-- Mark baseline applied WITHOUT executing the CREATE TABLEs.
-- Hash = sha256 of ${baselinePath} (same as drizzle-orm/migrator.js).
-- created_at = journal "when" (${createdAt}) so later migrations run and the baseline does not.

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- Only safe after verifying prod DDL already matches the baseline.
DELETE FROM drizzle.__drizzle_migrations;

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('${hash}', ${createdAt});
`;

console.log(sql);

if (!apply) {
  console.error('Dry-run only. Re-run with --apply --i-have-a-backup to execute against DATABASE_URL.');
  process.exit(0);
}

if (!confirmedBackup) {
  console.error('Refusing --apply without --i-have-a-backup (take a pg_dump -Fc first).');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required for --apply');
  process.exit(1);
}

const pg = await import('pg');
const client = new pg.default.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(sql);
  console.error('Marked baseline applied in drizzle.__drizzle_migrations');
} finally {
  await client.end();
}
