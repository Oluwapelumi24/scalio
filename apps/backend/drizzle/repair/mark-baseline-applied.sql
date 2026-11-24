-- ONE-OFF — run by a human on production AFTER verifying the live schema
-- matches src/db/schema (and the baseline SQL in this folder).
--
-- DO NOT run from CI or as a Railway preDeployCommand until that verification
-- is done. See AUDIT.md.
--
-- What this does:
-- 1. Ensures drizzle's migrations table exists (same shape drizzle-orm uses).
-- 2. Clears any prior migration hashes (history is untrustworthy — see AUDIT.md).
-- 3. Inserts a single row for the new baseline tag so `db:migrate` treats the
--    current schema as already applied and only runs future migrations.
--
-- Baseline tag must match the journal entry you install under drizzle/meta/_journal.json
-- after the cutover (default below matches repair/_journal.baseline.json).

BEGIN;

CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- Wipe prior history. Safe only when you have confirmed prod DDL already
-- matches the baseline and you are about to replace the migrations folder
-- with the single baseline.
DELETE FROM "__drizzle_migrations";

-- Hash: drizzle-kit stores the migration file contents hash. The Node migrator
-- recomputes from the SQL file on disk. After cutover, prefer running:
--   npm run db:migrate --workspace=apps/backend
-- once against a *staging* clone first so drizzle inserts the correct hash.
--
-- If you must seed manually, compute:
--   sha256sum apps/backend/drizzle/0000_baseline_current_schema.sql
-- (or whatever the installed baseline filename is) and paste below.
-- Leaving a placeholder that will NOT match forces you to use db:migrate once
-- on a verified empty __drizzle_migrations table instead of guessing.

-- Preferred path after cutover (empty table, baseline SQL present):
--   DATABASE_URL=... npm run db:migrate --workspace=apps/backend
-- That inserts the correct hash automatically. This DELETE-only script is then
-- enough as a prep step:

-- INSERT INTO "__drizzle_migrations" ("hash", "created_at")
-- VALUES ('REPLACE_WITH_SHA256_OF_BASELINE_SQL', EXTRACT(EPOCH FROM NOW())::bigint * 1000);

COMMIT;

-- Optional verification queries (run separately, outside the transaction):
-- SELECT * FROM "__drizzle_migrations";
-- \d vendors
-- \d services
