# Veno current product — vendor business setup, roles, attendance, ops

Inventory of **current** behavior from the codebase (medium thoroughness). Paths are absolute under `/Users/quadri.morin/Documents/projects/Veno`. Do not treat marketing copy as shipped product unless backed by app/backend code.

---

## 1. Registration → owner + business

**Flow:** email signup code → proof → `POST /vendor-auth/register`.

**Creates in one transaction-ish sequence:**
1. A `vendors` row (`slug` from business name, `approvalStatus: 'pending_review'`, optional category/address/registration number).
2. A `staff` row for the registrant with **`role: 'owner'`**, email, password hash, phone.

Evidence:
- `apps/backend/src/vendor-auth/vendor-auth.service.ts` (`register` inserts vendor then owner staff)
- `apps/backend/src/vendor-auth/dto/register-vendor.dto.ts`
- `apps/backend/src/vendor-auth/vendor-auth.controller.ts` (`@Post('register')`)
- Clients: `apps/vendor-mobile/src/lib/api.ts`, website `BusinessOnboarding` / register actions

**Listing gate:** business stays non-public until admin approval (`pending_review` | `approved` | `rejected`). Vendor UI treats Marketing/Money nav groups as `requiresSuite` (hidden until listing unlocked). Storefront/setup (services, hours, team, business page) is available earlier for owners/managers.

---

## 2. Staff roles and permissions

### Role enum (only four)

`staffRoleValues = ['owner', 'manager', 'practitioner', 'front_desk']`  
→ `apps/backend/src/db/schema/vendors.ts`

UI labels/hints → `apps/vendor-web/src/lib/roles.ts`:
| Role | Label | Hint (product copy) |
|------|--------|---------------------|
| owner | Owner | Sees everything, including money |
| manager | Manager | Runs the day: services, team, and every booking |
| practitioner | Takes appointments | Only their own appointments and clients |
| front_desk | Front desk | Books people in and answers messages. Not the money |

### How staff are added

- Owners/managers create staff via `vendor-admin/staff` (`@Roles('owner', 'manager')` for mutate; list open to all four roles for calendar columns).
- Optional email → invite to set password; omit email for calendar-only people.
- Only **owner** can delete staff (`@Roles('owner')` on DELETE).

Evidence: `apps/backend/src/vendor-admin/staff.controller.ts`, `staff.service.ts`, `dto/create-staff.dto.ts`

### Permission model

**Coarse role gates only** — Nest `@Roles(...)` on controllers + matching sidebar/page redirects. No separate permission matrix, custom roles, or per-action ACL beyond role.

`MANAGER_ROLES = ['owner', 'manager']` used consistently:
- Backend: `apps/backend/src/staff-schedule/access.ts`
- Web: `apps/vendor-web/src/lib/personalisation.ts`

### Role → surface access (nav + API)

Primary source of UI visibility: `apps/vendor-web/src/app/dashboard/SidebarNav.tsx` + `businessNav.ts`. Backend `@Roles` generally align; pages also redirect.

| Surface | owner | manager | practitioner | front_desk | Notes / evidence |
|---------|:-----:|:-------:|:------------:|:----------:|------------------|
| Home | ✓ | ✓ | ✓ | ✓ | Sidebar PRIMARY |
| Calendar / bookings | ✓ | ✓ | ✓ (own only) | ✓ | Practitioners filtered by `staffId` in `bookings.controller.ts` |
| Clients | ✓ | ✓ | — | ✓ | Nav + `customers.controller` |
| Inbox | ✓ | ✓ | — | ✓ | Practitioners redirected; inbox settings owner/manager only |
| Attendance | ✓ | ✓ | ✓ | ✓ | Managers oversee team; clockable roles self-clock (see §3) |
| Storefront (page/services/team/hours) | ✓ | ✓ | — | — | `businessNav.ts`; page redirects non-managers |
| Content studio | ✓ | ✓ | — | ✓ | Suite-gated; practitioner redirected |
| Ads | ✓ | ✓ | — | ✓ (view); create/manage often owner/manager | `ads` pages |
| Leads | ✓ | ✓ | ✓ (assigned) | ✓ | Practitioners see assigned; delete owner/manager |
| Feedback | ✓ | ✓ | ✓ | ✓ | Practitioners: own ratings; follow-up not for practitioner |
| Money / ledger / expenses | ✓ | ✓ | — | — | Finance controllers |
| Reports | ✓ | ✓ | — | — | |
| Payroll | ✓ | ✓ | — | — | Monthly salary model only |
| Performance | ✓ | ✓ | ✓ | — | front_desk redirected; API `@Roles('owner','manager','practitioner')` |
| Business payout bank account **change** | ✓ | — | — | — | `@Roles('owner')` on PUT account |
| Delete staff | ✓ | — | — | — | |

Personalisation home modules also role-filter (`apps/backend/src/personalisation/catalog.ts`): e.g. payroll/sales/team for managers; marketing modules for owner/manager/front_desk; `branches_soon` / `orders_soon` / `financing_soon` marked **`coming_soon`**.

---

## 3. Attendance (latest policy)

### Policy (implemented)

- **Clockable roles:** `practitioner`, `front_desk` only (`CLOCKABLE_ROLES`).
- **Owners and managers do not clock in.** They oversee the team and may clock practitioners/front_desk in/out on their behalf (`source: 'self' | 'manager'`).
- Attempting to clock an owner/manager → `ForbiddenException('Owners and managers do not clock in.')`.

Evidence:
- `apps/backend/src/staff-schedule/access.ts`
- `apps/backend/src/staff-schedule/attendance.service.ts` (`assertClockable`, `team` filters to CLOCKABLE_ROLES)
- `apps/backend/src/staff-schedule/staff-schedule.controller.ts` (AttendanceController comments + routes)
- UI copy: web `attendance/page.tsx`, mobile `AttendanceScreen.tsx` — “Owners and managers don’t clock in.”
- Home no longer surfaces clock-in as a quick action (`catalog.ts` comment; `home.spec.ts` asserts owner has `add_service` not `clock_in`)

### Model

- Table `attendance_records`: one open shift per staff (partial unique index); `clockInAt` / `clockOutAt`; `recordedById`.
- Schema: `apps/backend/src/db/schema/staff-schedule.ts`

### Who sees what

| Actor | Self clock UI | Team live view | History list |
|-------|---------------|----------------|--------------|
| practitioner / front_desk | Yes (`/attendance/me`, clock without `staffId`) | No | Own shifts only |
| owner / manager | No | Yes (`GET /attendance/team` — clockable roles only) | All clockable staff (or filter); can pass `staffId` |

Managers clock others by posting `staffId` (`resolveTargetStaff` allows managers to target anyone; service still rejects non-clockable roles).

### Related: schedules / time off

- Weekly pattern + time off: owners/managers set (`StaffScheduleController` PUT/POST/DELETE `@Roles('owner','manager')`); anyone can GET own schedule via `resolveTargetStaff`.

### Performance tie-in

- Attendance metric = clocked hours ÷ scheduled hours (pattern − breaks − time off), only after first business clock-in exists (`tracksAttendance`).
- Metric computed **only for practitioner / front_desk**; owners/managers get no attendance rates.

Evidence: `apps/backend/src/staff-schedule/performance.ts` (`clocksIn` check), `performance.service.ts`, web/mobile performance screens.

---

## 4. Ops modules — what exists

### Calendar / bookings
- All four roles; practitioners scoped to own bookings; can only create bookings assigned to self.
- Front desk / managers / owners see full calendar; sales in today’s summary only for owner/manager.
- Walk-in / phone booking from vendor app supported (API comments).
- Evidence: `apps/backend/src/vendor-admin/bookings.controller.ts`

### Clients
- Owner, manager, front_desk (`customers.controller`). Practitioners excluded from Clients nav (role hint says “own… clients” but Clients module is not in their sidebar).

### Inbox
- Owner, manager, front_desk. Social/messaging inbox; settings owner/manager.

### Storefront / business setup
- Owner/manager: business page, services (duration, price, payment mode pay-on-arrival / deposit / full prepayment), team, hours.
- Listing approval by platform admin.

### Payroll
- **Monthly fixed salary** + staff bank details; owner pays from own bank; mark paid / skip; schedule window around pay day.
- Veno does not move salary money (ledger/audit only).
- Evidence: `apps/backend/src/finance/payroll.service.ts`, `db/schema/finance.ts` (`monthlySalaryKobo` only)

### Performance
- Sales, completed, completion rate, unique/repeat customers, attendance (when tracked), feedback ratings.
- Managers see team; practitioners see self.

### Marketing suite (post-approval)
- Content studio (AI-assisted posts), Ads (Meta), Leads CRM, Feedback follow-up.
- Stock/orders, financing, multi-branch: **coming soon** modules only in personalisation catalog — not implemented product surfaces.

### Money / reports
- Owner/manager: ledger, expenses, period summary, reports endpoints.

---

## 5. Compare-ready: has vs lacks (salon-typical)

### Has (in code today)
- Business registration + pending listing review
- Four fixed roles with role-gated nav/API
- Team invite / calendar-only staff without login
- Bookings calendar, walk-ins, deposits/prepay modes
- Clients list (non-practitioners)
- Staff weekly schedules + time off
- Attendance clock for practitioners & front desk; manager override clock; owners/managers oversee only
- Performance metrics incl. attendance rate for clockable roles
- Fixed monthly payroll recording (off-platform payment)
- Inbox, content, ads, leads, feedback
- Single-location vendor model (`vendors` one row per business; no location entity)

### Clearly absent from code (do not invent)
| Typical salon feature | Status in Veno codebase |
|----------------------|-------------------------|
| Staff commissions / service % splits | **Absent** — payroll is `monthlySalaryKobo` only; website marketing mentions commission but no commission tables/services |
| Booth rent / chair rental | **Absent** — no schema or services |
| Tip tracking / tip pools | **Absent** — no tip entities |
| Granular / custom permissions | **Absent** — four roles only |
| Multi-location / multi-branch | **Absent** — `branches_soon` coming_soon; one vendor = one business |
| Retail / inventory / POS product sales | **Absent** — `orders_soon` coming_soon |
| Gift cards / memberships / packages-as-prepaid | **Not found** as ops features (services have `package` type for bookable offerings, not gift cards) |
| Owner/manager time clocks | **By design removed** — they oversee only |
| Automated salary disbursement | **Absent** — owner marks paid after paying from own bank |

---

## 6. Quick evidence index

| Topic | Key paths |
|-------|-----------|
| Register → owner | `apps/backend/src/vendor-auth/vendor-auth.service.ts` |
| Roles enum | `apps/backend/src/db/schema/vendors.ts`, `apps/vendor-web/src/lib/roles.ts` |
| Clockable vs managers | `apps/backend/src/staff-schedule/access.ts`, `attendance.service.ts` |
| Attendance API/UI | `staff-schedule.controller.ts`, `vendor-web/.../attendance/page.tsx`, `vendor-mobile/.../AttendanceScreen.tsx` |
| Nav by role | `apps/vendor-web/src/app/dashboard/SidebarNav.tsx`, `businessNav.ts` |
| MANAGER_ROLES | `personalisation.ts` (web), `access.ts` (backend), `catalog.ts` |
| Payroll | `apps/backend/src/finance/payroll.service.ts`, `db/schema/finance.ts` |
| Performance + attendance policy | `apps/backend/src/staff-schedule/performance.ts` |
| Coming soon (branches/stock/financing) | `apps/backend/src/personalisation/catalog.ts` |

---

*Generated from codebase inspection for salon-ops comparison. Prefer re-checking controllers if comparing after large auth/attendance PRs.*
