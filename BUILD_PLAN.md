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

## Phase 4 — Vendor-web (currently empty)
- [ ] Scaffold the app (framework TBD)
- [ ] Vendor admin: schedule management, service/staff CRUD, booking calendar,
      customer CRM view (visit count, lifetime value, no-show tracking)

## Phase 5 — Notifications & ops
- [ ] Email/SMS for booking confirmations, reminders, cancellations
- [ ] Basic analytics/reporting endpoints

## Reference
- Booking state machine: `apps/backend/src/booking/booking-state-machine.ts` (PRD §9.3/§5.5)
- Slot locking: `apps/backend/src/booking/slot-lock.service.ts` (PRD §9.3, 10-min hold)
- Auto-CRM-on-first-booking: `apps/backend/src/booking/booking.service.ts` (PRD §6.1)
- Sign-up is email+name only by design: `apps/backend/src/auth/auth.service.ts`
