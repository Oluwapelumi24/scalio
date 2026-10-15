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
| `Scalio/` | A SwiftUI Xcode project | Looks unused next to the Expo apps. **Decide:** keep or remove (D7). |

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
| D1 | What the 2.3% financing rate is: monthly, annual, or flat fee. Never shown as guaranteed. | Phase 6 |
| D2 | Licensed partner for wallet custody and transfers (Paystack Transfers/Balance vs. a bank or licensed MMO). The wallet UI alone gives no right to hold funds. | Phase 3 |
| D3 | Lending partner and who makes the credit decision. | Phase 6 |
| D4 | AI provider for captions; WhatsApp Business Solution Provider. | Phase 4 |
| D5 | Business size: worked out from staff/branch counts (recommended) rather than a self-picked label. | Home, settings |
| D6 | Vendor bottom nav: proposed **Home / Business / Customers / Money / More** — test with real vendors before locking. | Phase 1 design |
| D7 | Keep or remove the SwiftUI `Scalio/` project. | Repo hygiene |
| D8 | Vendor sign-in methods: add phone OTP (SMS provider needed) + Google + Apple alongside email. | Phase 1 |

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

**Ranking** — one pure, deterministic function in a shared package, used by vendor
mobile and vendor web:

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
- [ ] `business_preferences` table: interests, home pins/hides, onboarding state, keyed by vendor (and later user).
- [ ] `personalisation` module: `GET/PUT /vendor-admin/preferences`, `GET /vendor-admin/home` returning ranked modules + their data.
- [ ] `vendors.timezone` (default `Africa/Lagos`); `business_locations` table with a default location backfilled per vendor; nullable `locationId` on staff, bookings, business hours.
- [ ] Vendor auth: phone OTP, Google, Apple — supplementing email + password, not replacing them.
- [ ] Public booking link: `GET /public/vendors/:slug` (services, hours, availability) reusing `VendorService.getAvailability`.

Shared
- [ ] `packages/personalisation`: interest taxonomy, module registry, ranking function + fixtures/tests.
- [ ] Grow `packages/shared-types` into the API contract for every new endpoint.

Vendor mobile
- [ ] Rework onboarding to the 3 screens (*Doing business the right way / Grow your business / Run your business with ease*) with progress dots and Skip.
- [ ] Sign-in screen with Google, Apple, phone, email; terms and privacy links.
- [ ] Interest selection screen immediately before Home (grid of cards, sticky Continue).
- [ ] Home screen built from the ranked modules; "Customise home" + reset; interests editable in Settings.
- [ ] Move to the D6 navigation once tested.
- [ ] Extract shared components (cards, status labels, empty/error states, confirm dialogs).

Vendor web
- [ ] Same interests screen and ranked home, wider layout.

Website
- [ ] Public booking page at `/{slug}` with the vendor's branding and hours — customers book without installing the app; link shareable to WhatsApp/Instagram/Facebook.

### Phase 2 — Operations: bookings, customers, staff

- [ ] Staff schedules: per-staff working hours, breaks, leave; availability checks use them (extends `availability.ts`).
- [ ] Attendance (clock-in/out) — only then show attendance metrics.
- [ ] Staff profile: services they perform, salary or commission setup, location.
- [ ] Performance view per staff: sales generated, completed services, completion rate, repeat customers, feedback, attendance. Each metric shows how it's calculated; filters by date, staff, location, service. No single overall score.
- [ ] Customer follow-ups and rebook reminders (uses `vendors.averageDaysBetweenVisits` already in the schema).
- [ ] Orders for businesses that don't take appointments (`services.serviceType` already distinguishes types).

### Phase 3 — Finance: wallet, salary windows, payouts (depends on D2)

- [ ] `ledger_entries` as the authoritative record; balances derived as available / pending / reserved.
- [ ] Payout beneficiaries per staff: masked in the UI, verified on add or change.
- [ ] Salary schedule per business (e.g. monthly on the 25th, in the business timezone); paused/unset → payouts disabled with the reason and next date shown.
- [ ] `salary_runs` + `payouts`: select staff → total + fees + source balance → authorise (re-auth) → per-person status (pending / successful / failed / reversed) → receipts on mobile and web.
- [ ] Idempotency key per payout, verified provider webhooks, daily reconciliation job, audit log of every authorisation and status change.
- [ ] Expenses and simple cash-flow view.
- [ ] Admin web: payout and reconciliation oversight.

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

- [ ] Financing offers built from transaction history plus the partner's underwriting. Show rate basis, fees, repayment schedule, total repayment and late-payment consequences before acceptance.
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
  personalisation/        interests, module registry, ranking
  permissions/            role → capability map shared by both vendor apps
```

---

## 7. Acceptance checks

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
