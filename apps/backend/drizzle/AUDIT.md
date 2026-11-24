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

## Proposed repair (preferred)

1. **Verify production DDL** against `src/db/schema` (or against `repair/0000_baseline_current_schema.sql`). Especially check the four “push-only” columns above and that `approval_status` exists.
2. If prod is missing columns/tables, apply the missing `ALTER`/`CREATE` statements **manually** (or from the baseline file’s relevant sections) until prod matches the baseline. Prefer additive ALTERs over dropping data.
3. **Cut over migration history** (do not delete history without an archive):
   - Move current `drizzle/*.sql` + `drizzle/meta/*` → `drizzle/archive/pre-baseline-YYYYMMDD/` (keep for forensics).
   - Install the baseline from `drizzle/repair/`:
     - `0000_baseline_current_schema.sql` → `drizzle/0000_baseline_current_schema.sql`
     - `0000_snapshot.json` → `drizzle/meta/0000_snapshot.json`
     - `_journal.baseline.json` → `drizzle/meta/_journal.json` (edit the tag/filename if you rename).
4. On production, run `drizzle/repair/mark-baseline-applied.sql` (clears `__drizzle_migrations`), then run `npm run db:migrate --workspace=apps/backend` once so Drizzle inserts the correct content hash for the baseline. Use a staging clone first.
5. Only after that, add the migrate step to Railway (see below). **Do not** add it in this PR.

### Why not replay 0000–0022 on prod?

Broken numbering, orphan approval migration, missing push-only columns, and incomplete snapshots make a clean replay unsafe. A baseline that matches the TypeScript schema is the lowest-risk path once prod DDL is verified.

## Scripts added

| Script | Purpose |
| --- | --- |
| `db:generate` | `drizzle-kit generate` |
| `db:migrate` | `node scripts/db-migrate.mjs` (drizzle-orm migrator + `pg`) |
| `db:push:local-only` | Guarded `drizzle-kit push` — refuses `NODE_ENV=production` or non-localhost `DATABASE_URL` |

Old `db:push` is removed from package.json (replaced by the guarded name).

## Railway `preDeployCommand` (add **after** human cutover)

Do **not** add this yet. After baseline is marked applied on prod:

```json
"preDeployCommand": "npm run db:migrate --workspace=apps/backend"
```

Place it under `deploy` in both root `railway.json` and `apps/backend/railway.json` (whichever Railway uses for the API service). Keep `healthcheckPath` / start command unchanged until the observability PR.

## Scratch generate note

Command used (config was temporary and deleted):

```bash
npx drizzle-kit generate --config=drizzle.scratch.config.ts
# out → /tmp/veno-drizzle-scratch (39 tables → 0000_*.sql)
```

Copied artifacts: `drizzle/repair/0000_baseline_current_schema.sql`, `0000_snapshot.json`, `_journal.baseline.json`.
