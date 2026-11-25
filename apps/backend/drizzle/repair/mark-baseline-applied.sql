-- ONE-OFF — mark the baseline as already applied WITHOUT running its CREATE TABLEs.
-- Prefer generating this from the files (hash + when stay correct):
--
--   node apps/backend/scripts/db-mark-baseline.mjs
--   # review the printed SQL, then:
--   DATABASE_URL=… node apps/backend/scripts/db-mark-baseline.mjs --apply --i-have-a-backup
--
-- DO NOT run `db:migrate` against an empty drizzle.__drizzle_migrations while the
-- baseline .sql is in drizzle/ — that would EXECUTE the CREATE TABLEs against prod.
--
-- Drizzle's node-postgres migrator uses schema "drizzle", not public
-- (node_modules/drizzle-orm/pg-core/dialect.js → migrate()).

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- Wipe prior history only after prod DDL has been verified against the baseline.
DELETE FROM drizzle.__drizzle_migrations;

-- REPLACE both values with output from scripts/db-mark-baseline.mjs:
--   hash       = sha256 hex of the baseline .sql file bytes (migrator.js readMigrationFiles)
--   created_at = the baseline entry's `when` from meta/_journal.json (NOT wall-clock now)
-- If created_at is lower than the journal `when`, migrate() will re-run the baseline.
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('REPLACE_WITH_SHA256_FROM_db-mark-baseline.mjs', 1795540174586);
