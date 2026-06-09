# Scalio Build Plan

Whitelabel booking app (NestJS backend, Expo mobile, vendor-web admin, shared-types).
Amounts are stored in kobo — assume Nigerian market; payments via **Paystack**.

Update this file as phases complete (check items off, add notes on decisions/deviations).

## Phase 1 — Backend booking core (current focus)
- [x] `vendor.service.ts`: real `getAvailability` — already implemented (computes open slots
      from business hours, existing active bookings incl. pending_payment rows, and the
      Postgres partial unique index backstop; see `availability.ts` + `availability.spec.ts`)
- [x] Wire booking endpoints end-to-end (create → lock → confirm/cancel/no-show) — service
      layer was already complete; added `booking.service.spec.ts` (10 tests) covering
      CRM-customer creation/reuse, lock acquire/release, Postgres-conflict fallback, valid
      and invalid state transitions, and the optimistic-concurrency retry path
- [x] Email OTP verification at booking time (PRD §4.1 step 7 — deviates from the original
      "phone OTP" idea: chosen to be **email**-based via **Resend**). New pieces:
      `mail/` module (`MailService` wraps Resend, `RESEND_API_KEY`/`MAIL_FROM` in `.env.example`),
      `auth/otp.service.ts` (6-digit code, Redis-backed with `OTP_TTL_SECONDS` = 10 min,
      atomic compare-and-delete verification mirroring `SlotLockService`'s release script),
      `POST /auth/otp/request` endpoint, and `CreateBookingDto.email`/`otpCode` — booking
      creation now verifies-and-consumes the code before doing anything else (throws
      `UnauthorizedException` if invalid/expired). Covered by `otp.service.spec.ts` and a
      new case in `booking.service.spec.ts`. `customers.phone` stays nullable/unused for now.

## Phase 2 — Payments (Paystack)
- [x] Integrate Paystack for `deposit` / `full_prepayment` modes
      `PaystackService` (initializes transactions, verifies webhook signatures via
      HMAC-SHA512 over the raw body); `BookingService.createPendingBooking` now
      requires email-OTP verification (`OtpService.verifyCode`), then for
      `deposit`/`full_prepayment` initializes the Paystack transaction *before*
      writing the booking row (status `pending_payment`, `paystackReference` stored)
      so a Paystack outage never leaves a dangling DB row; `pay_on_arrival` skips
      Paystack entirely and is created directly as `confirmed`.
- [x] Webhook handling: transition `pending_payment` → `confirmed` on success; release the
      Redis slot lock (10-min TTL, `SLOT_LOCK_TTL_SECONDS`) on failure/timeout
      `PaystackWebhookController` (`POST /payments/paystack/webhook`, raw-body
      signature verification) calls `confirmPaymentByReference` /
      `failPaymentByReference`, which look the booking up by `paystackReference`
      and apply the existing state-machine transitions (releasing the slot lock on
      failure). Both are idempotent no-ops on retried Paystack deliveries.

## Phase 3 — Mobile app
- [x] Audit `src/lib/api.ts` and `src/lib/session.ts` (token refresh, error states) —
      `api.ts` was missing `requestOtp`/`createBooking`/payment-checkout types entirely;
      `session.ts` is an intentional in-memory placeholder pending real token persistence.
- [x] Connect the 6 existing screens (Onboarding → SignUp → VendorSelection →
      ServiceSelection → ScheduleAppointment → BookingConfirmation) to the live backend —
      `ScheduleAppointmentScreen` now resolves payment mode across mixed-mode service
      selections (most-demanding-mode-wins), requests/verifies the email OTP, and calls
      `createBooking`; `BookingConfirmationScreen` branches on whether a Paystack
      checkout is required (deposit/full_prepayment) vs. an immediate confirmation
      (pay_on_arrival), opening the checkout URL via `Linking.openURL`.
- [x] Guest-first discovery flow (Chowdeck-style) — reworked the entry funnel to
      `Onboarding (3-slide carousel) → InterestSelection → Home`, where Home is
      browsable as a **guest** (search bar, category filter chips tied to the
      interest taxonomy, a "Featured" row backed by a new `vendors.featured`
      column, and the vendor list). `VendorSelectionScreen` was retired in favor
      of `HomeScreen`. Onboarding completion + selected interests persist via
      `@react-native-async-storage/async-storage` (`lib/preferences.ts`) so
      returning users skip straight to Home. The auth gate stays exactly where
      it already was — `requireSignedInUser()` in `ScheduleAppointmentScreen`
      redirects guests to `SignUp` only when they try to book; `SignUpScreen`
      now `goBack()`s to wherever the guest was (rather than resetting the
      stack) so they don't lose their place mid-booking.
- [x] Push notifications / booking reminders — backend: `expoPushToken` column on
      `users`, `@Global() PushModule`/`PushService` (POSTs to Expo's push API,
      swallows delivery errors), `BookingService` fires "booking confirmed"/
      "booking cancelled" pushes on the relevant state transitions, and a
      `BookingRemindersService` cron (`@Cron(EVERY_5_MINUTES)`) sends an "appointment
      coming up" push ~60 minutes ahead using an atomic claim-before-send guard
      (`reminderSentAt` column) to dedupe across concurrent runs. `POST /auth/push-token`
      stores the device token. Mobile: installed `expo-notifications`/`expo-device`,
      added `registerForPushNotifications()` (permission request + token fetch +
      registration, best-effort/non-blocking) wired into `SignUpScreen` post sign-up.

## Phase 4 — Vendor-web
- [x] Scaffold the app — Next.js (App Router, TypeScript, Tailwind, ESLint),
      chosen for admin-dashboard ergonomics and to share `@scalio/shared-types`.
      Dev server runs on port 3001 (3000 is the backend API).
- [x] Vendor auth (backend) — per-staff login via the existing `staff` table
      (reuses its `owner`/`manager`/`practitioner`/`front_desk` role enum),
      platform-provisioned + invite-to-activate (no public signup). New
      `vendor-auth/` module: `staff.passwordHash`/`lastLoginAt` columns
      (migration `0005_demonic_magma.sql`), Redis-backed single-use invite
      tokens (`VendorInviteService`, mirrors `OtpService`'s atomic
      compare/get-and-delete pattern, 7-day TTL), `VendorAuthService`
      (issueInvite/acceptInvite/login, bcrypt-hashed passwords), a
      `vendor-jwt` Passport strategy + `VendorAuthGuard` + `@CurrentStaff()`
      decorator that re-resolves the staff row on every request (so a
      deactivated account loses access immediately, not just at token
      expiry). Routes: `POST /vendor-auth/invite` (always 204s — never
      reveals whether an email is known), `POST /vendor-auth/accept-invite`,
      `POST /vendor-auth/login`, `GET /vendor-auth/me`. New env vars
      `VENDOR_JWT_SECRET`/`VENDOR_WEB_URL`. 14 new tests, 61/61 passing.
- [x] Vendor admin (backend) — new `vendor-admin/` module, every route gated
      behind `VendorAuthGuard`/`@CurrentStaff()` and ownership-scoped to
      `staff.vendorId` (cross-vendor access 404s rather than leaking
      existence, mirroring the invite-enumeration protection):
      - **Services CRUD**: `GET/POST /vendor-admin/services`,
        `PATCH/DELETE /vendor-admin/services/:id`
        (`VendorServicesService`/`VendorServicesController`)
      - **Staff CRUD**: `GET/POST /vendor-admin/staff`,
        `PATCH/DELETE /vendor-admin/staff/:id`
        (`VendorStaffService`/`VendorStaffController`; creating a staff
        member with an email auto-issues a `VendorAuthService.issueInvite`;
        `list()` exposes `hasActivatedAccount` as a real boolean SQL
        expression rather than the raw `passwordHash` column)
      - **Schedule**: vendor-configurable weekly business hours
        (`business_hours` table, atomic transactional swap via
        `setBusinessHours`) and one-off `blackout_dates` — new schema file
        `db/schema/schedule.ts`, migration `0006_eminent_storm.sql`.
        `VendorService.getAvailability` now checks blackout dates first and
        resolves vendor-configured hours via `resolveOpenHours`, threading
        an additive `OpenHours` parameter through
        `computeAvailableSlotOffsets` (default preserves existing tests).
        Routes: `GET/PUT /vendor-admin/schedule/hours`,
        `GET/POST /vendor-admin/schedule/blackout-dates`,
        `DELETE /vendor-admin/schedule/blackout-dates/:id`
        (`VendorScheduleService`/`VendorScheduleController`)
      - **Booking calendar/management**: `BookingService` gained an optional
        `vendorId` ownership-scoping parameter threaded through
        `cancelByVendor`/`markCompleted`/`markNoShow`/`transition`, plus a
        new `listForVendor(vendorId, status?)` (newest-first). Routes:
        `GET /vendor-admin/bookings`,
        `POST /vendor-admin/bookings/:id/{cancel,complete,no-show}`
        (`VendorBookingsController`)
      - **Customer CRM**: read-only list/detail plus notes editing —
        `GET /vendor-admin/customers`, `GET /vendor-admin/customers/:id`,
        `PATCH /vendor-admin/customers/:id/notes`
        (`VendorCustomersService`/`VendorCustomersController`)
      All wired together in `vendor-admin.module.ts` → `AppModule`. 36 new
      tests, 92/92 passing.
- [x] Vendor-web frontend: login/accept-invite screens + dashboard shell (2026-06-09)
      `apps/vendor-web/src/app/` — full App Router dashboard consuming all
      `/vendor-auth/*` and `/vendor-admin/*` endpoints. JWT stored in httpOnly
      `vendor_token` cookie (set/cleared in server actions). Auth guard in
      `dashboard/layout.tsx` calls `GET /vendor-auth/me` on every load to
      validate the session and get staff info for the sidebar. Route map:
      - `/login` → email+password login with `useActionState` error display
      - `/accept-invite?token=` → set-password form, auto-signs in on success
      - `/dashboard` → redirects to `/dashboard/bookings`
      - `/dashboard/bookings` → booking list with status filter tabs and
        Cancel/Complete/No Show action buttons (`BookingActions` client component
        using `useTransition`)
      - `/dashboard/services` → services table + inline create form (delete per row)
      - `/dashboard/staff` → staff table with invite-pending badges + inline create
        (email field triggers the backend invite flow automatically)
      - `/dashboard/schedule` → business hours grid (`ScheduleHoursForm` client
        component with day toggle + time pickers) + blackout dates CRUD
      - `/dashboard/customers` → customer list linking to detail pages
      - `/dashboard/customers/[id]` → customer detail + notes editor
      `src/lib/api.ts` → `apiFetch()` wrapper (no-store cache, typed ApiError)
      `src/lib/session.ts` → `getToken/requireToken/setToken/clearToken`
      (httpOnly cookie, 7-day maxAge). TypeScript clean, build passes (12 routes).

## Phase 5 — Notifications & ops
- [ ] Email/SMS for booking confirmations, reminders, cancellations
- [ ] Basic analytics/reporting endpoints

## Reference
- Booking state machine: `apps/backend/src/booking/booking-state-machine.ts` (PRD §9.3/§5.5)
- Slot locking: `apps/backend/src/booking/slot-lock.service.ts` (PRD §9.3, 10-min hold)
- Auto-CRM-on-first-booking: `apps/backend/src/booking/booking.service.ts` (PRD §6.1)
- Sign-up is email+name only by design: `apps/backend/src/auth/auth.service.ts`
