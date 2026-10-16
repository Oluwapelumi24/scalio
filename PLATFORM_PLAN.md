# Scalio Platform Plan — from booking app to business operating system

Scalio is moving from a vendor booking app to the place a small business runs
everything: bookings, customers, staff, money, marketing and financing. This plan
maps that direction onto **the code that exists today** and sequences the work so
nothing that works now gets replaced.

`BUILD_PLAN.md` stays the record of the booking build (Phases 1–5 there). This file
is the next layer on top of it. Check items off and note decisions as they land.

**Guiding rule:** one platform, one set of business records, a personalised
experience per business. Mobile and web are two views of the same business, never
two copies of its data.

---

## 1. Where the code is today (audit, 2026-10-15)

| Area | What exists | Reuse for the new direction |
|---|---|---|
| Monorepo | npm workspaces: `apps/*`, `packages/*` | Keep. Add shared packages here (see §6). |
| Backend | NestJS + Drizzle/Postgres + Redis. Modules: `auth`, `booking`, `payments` (Paystack), `vendor`, `vendor-auth`, `vendor-admin`, `notifications`, `mail` (Resend), `super-admin`, `waitlist` | Becomes the shared business platform. New domains are new Nest modules beside these. |
| Data | `vendors`, `staff` (roles `owner/manager/practitioner/front_desk`), `services` (payment modes), `bookings` (with `staffId`, state machine, slot locks), `customers` (per-vendor CRM: visits, LTV, no-shows, notes), `business_hours`, `blackout_dates`, `users`, `admins` | Booking → customer → staff links already exist. That is the core of the "connected workflow". |
| Vendor mobile | Expo. Onboarding, Register/Login/Forgot/Reset, tabs **Dashboard / Bookings / Customers / Settings**, Services, Staff, Business hours, Blackout dates | The surface that becomes the business control centre. |
| Vendor web | Next.js 16: bookings, services, staff, schedule, customers | The full dashboard. Same endpoints as vendor mobile. |
| Admin web | Super-admin portal: vendors, reviews/approval, payments, metrics, reports, team | Gains oversight of the new modules (payouts, financing, publishing). |
| Consumer mobile | Guest-first discovery, interest selection, booking + laundry flows, Paystack checkout | The customer-facing booking surface. Its interest screen is about *what customers want to book* — a different taxonomy from the vendor interests in §3. Don't merge them. |
| Website | Marketing site + waitlist | Will host public booking pages (§4, Phase 1). |
| Shared types | `packages/shared-types` (~80 lines: booking, customer, vendor) | Grows into the shared API contract. |

(The `Scalio/` SwiftUI folder seen on the local machine is not part of the repo: it is git-ignored as iOS prebuild output and is an empty Xcode template.)

**Gaps the new direction needs filled:**

- No **business locations/branches** — everything is scoped by `vendorId` only.
- No **business timezone** on `vendors` (needed for salary windows and reminders).
- Vendor onboarding state lives in device storage (`vendor-mobile/src/lib/preferences.ts`)
  — interests must live on the server so they follow the business across devices.
- No **wallet, ledger, payouts, expenses, or salary configuration**. Paystack is used
  only for customer booking payments.
- No **staff schedules / attendance** — only business-wide hours and blackout dates.
- No **public booking link page** for vendors to share (consumer app requires install).
- No **Google/Apple sign-in** or phone sign-in for vendors (email + password today).
- Vendor mobile has no shared component library; theme tokens live in
  `vendor-mobile/src/theme/index.ts` only.

---

## 2. Decisions to make before the work that depends on them

| # | Decision | Blocks |
|---|---|---|
| D1 | ✅ **Decided:** 2.3% is the interest rate **per month** — 27.6% a year simple (12 × 2.3%), about 31.4% a year if it compounds monthly. Still to settle with the lender: flat on the original amount vs. on the reducing balance (changes the total repaid), and whether it is the same for every business. Never shown as guaranteed. | Phase 6 |
| D2 | ✅ **Decided (2026-10-16):** Scalio never holds money. Customer payments use **Paystack split payments** — each business gets a Paystack subaccount and Paystack settles to its own bank (`PLATFORM_COMMISSION_PERCENT` is Scalio's cut). Salaries use **option 1**: Scalio works out who to pay and when, the owner pays from their own bank and records it. A licensed banking partner (option 3, true wallet + transfers) can come later. Still to confirm: Paystack approves the split-payment setup; a fintech lawyer confirms no CBN licence is needed while non-custodial (NDPC registration is likely needed for the bank details we store). | Phase 3 |
| D3 | ✅ **Decided:** financing comes through a lending partner, who makes the credit decision and holds the licence. Partner still to be chosen. | Phase 6 |
| D4 | AI provider for captions; WhatsApp Business Solution Provider. | Phase 4 |
| D5 | Business size: worked out from staff/branch counts (recommended) rather than a self-picked label. | Home, settings |
| D6 | Vendor bottom nav: proposed **Home / Business / Customers / Money / More** — test with real vendors before locking. | Phase 1 design |
| D8 | Vendor sign-in: add phone OTP + Google + Apple alongside email. SMS provider: **Mono** chosen, but Mono's site lists no SMS/OTP product (its products are Connect, DirectPay, DirectDebit, Disburse, Lookup, Prove) — **confirm** which Mono product sends the codes, or pick an SMS provider. Hide the provider behind an `SmsProvider` adapter so it can change. | Phase 1 |
| D9 | Worth evaluating Mono for other parts of the plan: **Disburse** (staff payouts, D2), **Connect / Creditworthiness** (financing eligibility, Phase 6), **Lookup / Prove** (verifying staff payout accounts and vendor identity). | Phases 3, 6 |

**Start long-lead approvals now** (they run in parallel with Phases 1–3): Meta app
review (Instagram/Facebook publishing, messaging, ads), TikTok Content Posting API,
payment-partner due diligence for payouts.

---

## 3. Personalisation engine (spec — build before redesigning the home screen)

**Interests** — stored server-side on the business, multi-select, changeable any time.

| Group | Interests |
|---|---|
| Manage my business | Manage bookings · Manage my staff · Track my sales and money · Pay my staff · Manage my stock and orders |
| Get more customers | Find new customers · Run ads for my business · Make posts for social media · Manage my social media |
| Keep my customers | Get customers to come back · Get reviews and feedback · Chat with my customers |
| Grow my business | Get money to grow my business · See how my business is doing · Manage more than one branch |

**Module registry** — every home-screen module is declared once:
`id`, pillar, layer (`overview | quick_action | attention | recommendation`),
required capability, required permission, data source.

**Ranking** — one pure, deterministic function, run on the backend
(`apps/backend/src/personalisation/ranking.ts`). Vendor mobile and vendor web both
receive the home screen already ranked from `GET /vendor-admin/home`, so the order
can't drift between platforms:

```
score(module) = interestWeight + businessTypeWeight + capabilityGate
              + recentUsage (decaying) + userPin − userHide
```

Fixed rules:

1. `attention` modules (pending confirmations, failed payouts, unpaid balances,
   schedule clashes) are **never** filtered by interests.
2. Nothing disappears — unselected modules rank lower and stay in the navigation.
3. Users can pin, hide and reset. Skipping the interest screen gives a sensible default.
4. The three reference businesses (booking-focused, growth-focused, finance-focused)
   are unit-test fixtures over the same registry — not three hardcoded screens.

**Home layers:** business overview → quick actions → needs your attention →
recommendations (rule-based first; AI later, once data is reliable). All figures
come from real records; sample data is labelled as illustrative.

---

## 4. Phases

Each phase ships design (mobile + web, with loading/empty/error/pending/disabled
states) and build. Every phase ends with the existing booking flows still passing.

### Phase 1 — Foundation: personalisation and core operations

Backend
- [x] `business_preferences` table: interests, home pins/hides, module usage, interests-completed stamp, keyed by vendor (migration `0011`).
- [x] `personalisation` module: `GET personalisation/interests`, `GET/PUT preferences`, `POST preferences/reset-home`, `GET home`, `POST home/usage` (all under `/vendor-admin`). Practitioners get a home scoped to their own bookings; money figures and setup tasks are owner/manager only.
- [x] `vendors.timezone` (default `Africa/Lagos`); "today" on the home screen follows it.
- [ ] `business_locations` table with a default location backfilled per vendor; nullable `locationId` on staff, bookings, business hours.
- [ ] Vendor auth: phone OTP, Google, Apple — supplementing email + password, not replacing them. *(Phone OTP on hold until the SMS provider is settled — D8.)*
- [x] Public booking link: `GET /vendors/by-slug/:slug` (approved businesses only; public fields, services, hours); open times reuse `GET /vendors/:id/availability`.
- [ ] Guest booking from the public page — bookings currently require a signed-in customer (`CreateBookingDto.userId`).

Shared
- [x] Interest list (15 interests in 4 groups), module registry and ranking with tests — built in the backend (`personalisation/`) rather than a shared package, so both apps get identical results without sharing code. The three reference businesses are test fixtures.
- [ ] Grow `packages/shared-types` into the API contract for every new endpoint.

Vendor mobile
- [x] Rework onboarding to the 3 screens (*Doing business the right way / Grow your business / Run your business with ease*) with progress dots and Skip.
- [ ] Sign-in screen with Google, Apple, phone, email *(terms and privacy shown on onboarding; social and phone sign-in not built yet)*.
- [x] Interest selection screen immediately before Home (grid of cards, sticky Continue, Skip). Shown once, after sign-in, to owners/managers.
- [x] Home screen built from the ranked modules; "Customise home" + reset; interests editable in Settings.
- [ ] Move to the D6 navigation once tested.
- [ ] Extract shared components (cards, status labels, empty/error states, confirm dialogs).

Vendor web
- [x] Same interests screen and ranked home, wider layout; `/dashboard/customise`.

Website
- [x] Public booking page at `/book/{slug}` with the vendor's branding and hours — customers see services, prices, hours and live open times without installing the app; vendors share it by copy or WhatsApp. Booking from the page waits on guest booking (above).

### Phase 2 — Operations: bookings, customers, staff

- [x] Staff schedules: per-staff weekly hours with a break, and time off; availability with a `staffId` respects them, and booking creation rejects slots outside them (shared `staff-schedule/staff-day.ts`). Mobile and web edit the same records.
- [x] Attendance: clock in/out for yourself (any role) or for others (owners/managers); one open shift per person, enforced by the database. Attendance metrics only appear once a business has clocked in, and only count scheduled hours from that day.
- [ ] Staff profile: services they perform, salary or commission setup, location. *(Salary/commission moves to Phase 3 with payroll; location waits on `business_locations`.)*
- [x] Performance view per staff: sales, completed, completion rate, unique and repeat customers, attendance — each with its definition shown; filters by period and staff (API also takes a service). No single score; unassigned bookings get their own row. Feedback shows as "not collected yet". Location filter waits on `business_locations`.
- [x] Bookings store their price at booking time (`total_price_kobo`, backfilled); completing a booking updates the customer's visits, spend and last visit; no-shows are counted. (Sales previously read ₦0 for pay-on-arrival bookings.)
- [ ] Customer follow-ups and rebook reminders (uses `vendors.averageDaysBetweenVisits` already in the schema).
- [ ] Orders for businesses that don't take appointments (`services.serviceType` already distinguishes types).

### Phase 3 — Finance: payments, salary windows, payroll (non-custodial — D2)

- [x] Online payments settle straight to the business: payout account checked with the bank, Paystack subaccount created, bookings charged with the split. Server checks the amount against the booking price; businesses without an account can't take online payments.
- [x] `ledger_entries` as the authoritative record of money in and out (booking payments, salaries, expenses), append-only with a dedupe key so repeats are safe. No balances — Scalio holds none.
- [x] Staff pay: monthly salary and bank account per person, name checked with the bank, account number encrypted (AES-256-GCM) and masked except on the transfer list.
- [x] Salary schedule per business (pay day 1–28, opens 3 days before, closes 5 after, in the business timezone); unset/paused/closed → payroll can't start, with the reason and dates shown.
- [x] `salary_runs` + `salary_payouts`: start once per month → transfer list → owner pays from their bank → mark each paid (optional bank reference) or skip. Home alert while people are still unpaid.
- [x] Audit log of account changes, schedule changes, runs and every paid/skipped payout.
- [x] Expenses and a monthly money summary (sales, received online, salaries, expenses, left over) on mobile and web.
- [ ] Admin web: payout account and Paystack subaccount oversight.
- [ ] Later, with a banking partner (option 3): wallet balances, transfers from Scalio, provider webhooks for transfer status, daily reconciliation.

### Phase 4 — Growth: content, ads, leads (depends on D4 + platform approvals)

- [ ] Content studio: add media → AI caption, hashtags, call to action → edit tone and pick platforms → preview → publish or schedule.
- [ ] One publishing interface with an adapter per platform (Instagram, Facebook, TikTok). Each adapter validates, submits and reports its own status. No automated WhatsApp Status; music limited to what each platform licenses.
- [ ] Content calendar, drafts, publishing history, retry on failure.
- [ ] Ads (Meta): objective, audience, budget, duration, preview, approval status, spend/reach/clicks/leads; pause/resume where the API allows.
- [ ] Leads linked to `customers`; unified inbox for supported channels with staff assignment and follow-up status.

### Phase 5 — Insights and retention

- [ ] Reports: sales, expenses, cash flow, bookings/cancellations, staff, acquisition, retention, per-location — each summary drills down to the records.
- [ ] Feedback requests after completed bookings; ratings feed staff performance.
- [ ] Better home recommendations from real data.

### Phase 6 — Expansion: financing and larger businesses (depends on D1 + D3)

- [ ] Financing offers built from transaction history plus the partner's underwriting. Show the rate as **2.3% per month** with its yearly equivalent next to it, plus fees, repayment schedule, total repayment in naira and late-payment consequences, before acceptance. Show the actual offered rate per business, not a headline rate for everyone.
- [ ] Application, approval, disbursement and repayment tracking.
- [ ] Multi-branch management and combined reporting (uses Phase 1's `business_locations`).
- [ ] Finer roles (add accountant), approval workflows, bulk actions.

---

## 5. Rules for every phase

- Every record is scoped to its business, and to a location where it applies.
- Payments, payroll, credit decisions and third-party publishing run only on the backend. Provider secrets never reach the apps.
- A client-side success message is never proof of settlement — status comes from backend records.
- Sample figures are labelled as illustrative. No mock financial transactions presented as real.
- Disabled actions always say why and what unlocks them.
- Business rules (ranking, permissions, validation) live once in shared packages or the backend — never duplicated between mobile and web.
- Size is progressive: solo businesses see simple tools; staff, branches and payroll appear as the business adds them. One product, not tiers of products.

---

## 6. Target code layout (incremental, not a rewrite)

```
apps/
  backend/src/            + personalisation/ locations/ staff-schedule/
                          + finance/ payroll/ financing/
                          + content-studio/ marketing/ reporting/
                          + integrations/{payments,social,messaging,ai,lending}/
  vendor-mobile/          control centre on mobile
  vendor-web/             full dashboard
  website/                marketing + public booking pages
  mobile/                 consumer booking app (unchanged direction)
  admin-web/              platform oversight
packages/
  shared-types/           API contracts
  permissions/            role → capability map shared by both vendor apps
```

---

## 7. Acceptance checks

> Known gap: slot times are computed in the server's local time, not the business's timezone (`vendor/availability.ts`). Fine while server and businesses are both in Lagos; fix before serving other timezones.


- [ ] A vendor can sign up with phone, email, Google or Apple, skip or finish onboarding, and pick several interests.
- [ ] Home reflects the saved interests on both mobile and web; unselected features stay reachable.
- [ ] Operational alerts show whatever the interests are.
- [ ] Staff, bookings, schedules and financial records match across mobile and web.
- [ ] Staff schedules block clashing bookings.
- [ ] Users only see businesses and records their role allows.
- [ ] Payouts can't start outside the salary window or with setup incomplete.
- [ ] Every payout has a traceable status and ledger record; duplicate requests are safe.
- [ ] AI content can be reviewed and edited before publishing; each platform shows what it actually supports.
- [ ] Leads and supported conversations link to customer records.
- [ ] Every module has loading, empty, error and success states.
- [ ] Existing booking flows (consumer booking, Paystack checkout, vendor booking management) still work.

## 8. Success measures

Track a baseline before Phase 1: onboarding completion and time to first booking
link shared; engagement with top-ranked modules; active businesses weekly/monthly;
bookings completed; lead-to-customer conversion; payout success and failure rate;
reconciliation accuracy; publishing success; crash and API error rates.
