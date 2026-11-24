# Drizzle migration audit (PR 4)

**No database was contacted while producing this file.** Scratch `drizzle-kit generate` output lived only under `/tmp/veno-drizzle-scratch` and is not committed; a copy of that baseline is under `drizzle/repair/`.

## Problems (summary)

| Issue | Detail |
| --- | --- |
| Duplicate prefixes | Two `0007_*` files; two `0009_*` files |
| Orphan SQL (not in journal) | `0007_vendor_address_rating.sql`, `0008_vendor_approval_status.sql` |
| Journal ↔ filename mismatch | Journal tag `0008_vendor_registration_number` maps to file `0009_vendor_registration_number.sql` |
| Snapshots lag journal | `meta/*_snapshot.json` stops at `0016`; journal continues through `0022_staff_commission` |
| Schema only via `db:push` | Several columns exist in `src/db/schema` but in **no** migration SQL (see below) |
| No migrate path | Only `db:push` existed; prod likely diverged via push |

## Per-file inventory

| SQL file | In `_journal.json`? | What it changes | Reflected in `src/db/schema`? |
| --- | --- | --- | --- |
| `0000_whole_hemingway.sql` | Yes (`0000_whole_hemingway`) | Core tables: `services`, `staff`, `vendors`, `customers`, `bookings` | Yes (later columns added elsewhere) |
| `0001_bent_stick.sql` | Yes | `users`; `customers.user_id` | Yes |
| `0002_fantastic_luminals.sql` | Yes | `bookings.paystack_reference` | Yes |
| `0003_parched_domino.sql` | Yes | `users.expo_push_token`, `bookings.reminder_sent_at` | Yes |
| `0004_little_omega_red.sql` | Yes | `vendors.featured` | Yes |
| `0005_demonic_magma.sql` | Yes | `staff.password_hash`, `last_login_at`, unique email | Yes |
| `0006_eminent_storm.sql` | Yes | `blackout_dates`, `business_hours` | Yes |
| `0007_stiff_malice.sql` | Yes | `admins`; `vendors.address/rating/review_count` | Yes |
| `0007_vendor_address_rating.sql` | **No** | Duplicate of address/rating/review_count already in `0007_stiff_malice` | Yes (via stiff_malice) |
| `0008_vendor_approval_status.sql` | **No** | `vendors.approval_status`, `review_note`, `reviewed_at`, `reviewed_by_id` | Yes — **but only this orphan file adds them** |
| `0009_vendor_registration_number.sql` | Tag `0008_vendor_registration_number` (idx 8) | `vendors.registration_number` | Yes |
| `0009_waitlist_signups.sql` | Yes (`0009_waitlist_signups`) | `waitlist_signups` | Yes |
| `0010_add_users_password_hash.sql` | Yes | `users.password_hash` | Yes |
| `0011_business_preferences.sql` | Yes | `business_preferences`; `vendors.timezone` | Yes |
| `0012_staff_schedule_attendance.sql` | Yes | attendance / time-off / working hours; `bookings.total_price_kobo` | Yes |
| `0013_finance.sql` | Yes | finance tables (ledger, payroll, expenses, …) | Yes |
| `0014_growth.sql` | Yes | content media/posts, leads | Yes |
| `0015_social_publishing.sql` | Yes | publications, social connections | Yes |
| `0016_feedback.sql` | Yes | `feedback_requests` | Yes |
| `0017_ads_manager.sql` | Yes (no snapshot) | meta ads account tables | Yes |
| `0018_inbox.sql` | Yes (no snapshot) | conversations, messages, inbox_settings | Yes |
| `0019_ad_campaigns.sql` | Yes (no snapshot) | campaigns, payments, credits, veno_page_access | Yes |
| `0020_vendor_notifications.sql` | Yes (no snapshot) | vendor_notifications; staff.notifications_read_at | Yes |
| `0021_slot_interval.sql` | Yes (no snapshot) | `vendors.slot_interval_minutes` | Yes |
| `0022_staff_commission.sql` | Yes (no snapshot) | commission columns on staff_pay / salary_payouts | Yes |

## Schema present in TypeScript but **not** covered by any migration SQL

Compared against a fresh `drizzle-kit generate` into an empty out dir (scratch; not committed). Baseline DDL includes columns/tables that never appear in the historical SQL files:

| Object | In schema | In any `drizzle/*.sql` |
| --- | --- | --- |
| `vendors.description` | Yes | **No** |
| `vendors.owner_name` | Yes | **No** |
| `vendors.owner_email` | Yes | **No** |
| `services.service_type` | Yes | **No** |
| `vendors.approval_status` (+ review fields) | Yes | Only orphan `0008_vendor_approval_status.sql` (not journaled) |

These almost certainly landed via `db:push` against some environments. Production may or may not have them — **a human must compare**.

## Snapshot / journal health

- Snapshots: `meta/0000_snapshot.json` … `meta/0016_snapshot.json` only.
- Journal entries idx 17–22 have **no** matching snapshots, so `drizzle-kit generate` against the live `out` folder cannot reliably diff from tip.
- Duplicate / mis-tagged files mean `drizzle-kit migrate` cannot be trusted on this history as-is.

## Production cutover (corrected)

**Never** run `db:migrate` against production (or any DB that already has tables) while `drizzle.__drizzle_migrations` is empty and the baseline `.sql` is present — that executes every `CREATE TABLE` in the baseline. Mark the baseline applied first, without running its SQL.

Drizzle’s node-postgres path records history in **`drizzle.__drizzle_migrations`** (schema `drizzle`), not `public.__drizzle_migrations`. The old repair script edited the wrong table.

### How the migrator decides what to run

Cited from installed `drizzle-orm@0.45.x`:

1. **Hash** — `node_modules/drizzle-orm/migrator.js` `readMigrationFiles` (≈ lines 15–23): reads the `.sql` file as a string and sets `hash = sha256(file contents).hex`.
2. **`created_at` / folder millis** — same function sets `folderMillis = journalEntry.when` from `meta/_journal.json`.
3. **Apply gate** — `node_modules/drizzle-orm/pg-core/dialect.js` `migrate()` (≈ lines 45–68): creates schema `drizzle` + table `__drizzle_migrations`; loads the latest row by `created_at desc`; for each migration, runs SQL + inserts a row **only if** there is no prior row **or** `Number(last.created_at) < migration.folderMillis`.

So the seeded row must use the **exact file hash** and **`created_at = baseline journal when`**. A wall-clock `created_at` that is lower than `when` makes Drizzle re-run the baseline.

### Drift to expect (and fix before marking)

The baseline sets `vendors.approval_status` default to **`pending_review`**. Orphan migration `0008_vendor_approval_status.sql` used default **`approved`**. That is exactly the kind of drift this audit is for — reconcile with a hand-written `ALTER` before cutover if prod still has the old default (and decide whether existing rows need updating).

### Procedure

#### 1. Backup first

```bash
pg_dump -Fc -f "veno-prod-$(date -u +%Y%m%dT%H%M%SZ).dump" "$DATABASE_URL"
```

Keep the dump until migrate has been proven on staging and prod cutover is done.

#### 2. Verify prod DDL against the baseline (do not mark yet)

Restore the baseline into a **fresh local** database, then compare schema-only dumps:

```bash
# Fresh empty local DB (example names — use a disposable DB, never prod)
createdb veno_baseline_check
psql "$LOCAL_BASELINE_URL" -v ON_ERROR_STOP=1 -f apps/backend/drizzle/repair/0000_baseline_current_schema.sql

# Schema-only dumps (no data)
pg_dump --schema-only --no-owner --no-acl "$PROD_DATABASE_URL" > /tmp/prod-schema.sql
pg_dump --schema-only --no-owner --no-acl "$LOCAL_BASELINE_URL" > /tmp/baseline-schema.sql

diff -u /tmp/prod-schema.sql /tmp/baseline-schema.sql | less
```

**Acceptable diffs** (document and ignore):

- Ownership / grants / tablespace noise if you omitted `--no-owner --no-acl` by mistake
- Extension version comments
- Irrelevant search_path noise

**Must reconcile before continuing** (hand-written SQL; prefer additive `ALTER`/`CREATE`):

- Missing tables or columns that exist in the baseline
- Wrong column types / nullability / defaults (especially `approval_status` default)
- Missing unique constraints / FKs the app relies on
- Extra prod-only objects: keep them unless they conflict; do not drop data to “match”

Apply reconcile SQL to **prod** (after backup) until a re-diff is clean for the must-fix list. Staging clone first.

#### 3. Install baseline files in the repo (history archive)

Do not delete history without an archive:

```bash
mkdir -p apps/backend/drizzle/archive/pre-baseline-$(date -u +%Y%m%d)
# move current drizzle/*.sql + drizzle/meta/* into that archive (keep forensics)
cp apps/backend/drizzle/repair/0000_baseline_current_schema.sql apps/backend/drizzle/
cp apps/backend/drizzle/repair/0000_snapshot.json apps/backend/drizzle/meta/
cp apps/backend/drizzle/repair/_journal.baseline.json apps/backend/drizzle/meta/_journal.json
```

Commit that cutover on a controlled branch after local proof (step 5).

#### 4. Mark applied WITHOUT running the baseline SQL

```bash
# Dry-run: prints SQL with computed hash + journal when
node apps/backend/scripts/db-mark-baseline.mjs

# Apply only with an explicit backup acknowledgement
DATABASE_URL=… node apps/backend/scripts/db-mark-baseline.mjs --apply --i-have-a-backup
```

The script creates `drizzle` schema + `drizzle.__drizzle_migrations`, deletes prior rows in **that** table, and inserts one row. It does **not** execute the baseline `CREATE` statements.

`repair/mark-baseline-applied.sql` is a human-readable template of the same idea; prefer the Node script so hash/`when` cannot drift.

#### 5. Prove locally before touching prod

```bash
# Fresh DB → apply baseline DDL via psql (this IS running CREATE TABLE — local only)
createdb veno_cutover_proof
psql "$PROOF_URL" -v ON_ERROR_STOP=1 -f apps/backend/drizzle/0000_baseline_current_schema.sql

# Mark applied (same as prod step 4)
DATABASE_URL="$PROOF_URL" node apps/backend/scripts/db-mark-baseline.mjs --apply --i-have-a-backup

# Must report nothing left to run (no CREATE TABLE attempts)
DATABASE_URL="$PROOF_URL" npm run db:migrate --workspace=apps/backend

# Add a dummy migration, migrate again — only the dummy must run
# (generate or hand-write 0001_*.sql + journal entry, then db:migrate)
```

Only after this proof: repeat backup → verify → mark on a staging clone of prod, then on prod.

#### 6. Railway migrate hook (after cutover)

Do **not** add this in this PR. After baseline is marked on prod:

```json
"preDeployCommand": "npm run db:migrate --workspace=apps/backend"
```

### Why not replay 0000–0022 on prod?

Broken numbering, orphan approval migration, missing push-only columns, and incomplete snapshots make a clean replay unsafe. A baseline that matches the TypeScript schema is the lowest-risk path once prod DDL is verified and history is marked applied without re-executing DDL.

## Scripts added

| Script | Purpose |
| --- | --- |
| `db:generate` | `drizzle-kit generate` |
| `db:migrate` | `node scripts/db-migrate.mjs` (drizzle-orm migrator + `pg`) |
| `db:push:local-only` | Guarded `drizzle-kit push` — refuses `NODE_ENV=production` or non-localhost `DATABASE_URL` |
| `scripts/db-mark-baseline.mjs` | Computes baseline sha256 + journal `when`; prints mark-applied SQL (dry-run); `--apply --i-have-a-backup` writes `drizzle.__drizzle_migrations` only |

Old `db:push` is removed from package.json (replaced by the guarded name).

## Scratch generate note

Command used (config was temporary and deleted):

```bash
npx drizzle-kit generate --config=drizzle.scratch.config.ts
# out → /tmp/veno-drizzle-scratch (39 tables → 0000_*.sql)
```

Copied artifacts: `drizzle/repair/0000_baseline_current_schema.sql`, `0000_snapshot.json`, `_journal.baseline.json`.
