import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, users } from '../db/schema';
import { OtpService } from '../auth/otp.service';
import {
  PaystackService,
  type InitializeTransactionResult,
} from '../payments/paystack.service';
import { PushService } from '../notifications/push.service';
import { SlotLockService } from './slot-lock.service';
import {
  applyBookingEvent,
  BookingEvent,
  BookingStatus,
  InvalidBookingTransitionError,
  isActiveStatus,
} from './booking-state-machine';

/** Modes that require collecting money up front, via Paystack, before the slot is confirmed. */
const PAYMENT_MODES_REQUIRING_PAYSTACK = [
  'deposit',
  'full_prepayment',
] as const;

export interface CreatePendingBookingInput {
  vendorId: string;
  /** The signed-up app user booking this appointment — resolved/linked to a per-vendor CRM record. */
  userId: string;
  /** Verified via POST /auth/otp/request + the code supplied here (PRD §4.1 step 7). */
  email: string;
  otpCode: string;
  staffId: string | null;
  serviceIds: string[];
  scheduledAt: Date;
  durationMinutes: number;
  paymentMode: 'pay_on_arrival' | 'deposit' | 'full_prepayment';
  amountDueKobo: number;
}

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly slotLock: SlotLockService,
    private readonly otp: OtpService,
    private readonly paystack: PaystackService,
    private readonly push: PushService,
  ) {}

  /**
   * Step 1-2 of PRD §9.3: verify the one-time email code (PRD §4.1 step 7),
   * acquire the Redis lock for this slot, then create the booking. The
   * Postgres partial unique index is the backstop if Redis is unavailable or
   * the lock already expired.
   *
   * `pay_on_arrival` bookings need no money up front, so they're created
   * straight into `confirmed`. `deposit`/`full_prepayment` bookings start a
   * Paystack transaction *before* the row is written — if Paystack is
   * unreachable we'd rather fail the request than leave a `pending_payment`
   * row with nothing to actually drive it to `confirmed`.
   */
  async createPendingBooking(input: CreatePendingBookingInput): Promise<{
    booking: typeof bookings.$inferSelect;
    payment: InitializeTransactionResult | null;
  }> {
    const verified = await this.otp.verifyCode(input.email, input.otpCode);
    if (!verified) {
      throw new UnauthorizedException('Invalid or expired verification code.');
    }

    const customerId = await this.findOrCreateCrmCustomer(
      input.vendorId,
      input.userId,
    );

    const lockKey = this.slotLock.buildKey(
      input.vendorId,
      input.staffId ?? 'any',
      toIsoMinute(input.scheduledAt),
    );
    const lock = await this.slotLock.acquire(lockKey);
    if (!lock) {
      throw new ConflictException(
        'This slot was just taken. Please pick another time.',
      );
    }

    const requiresPaystack = (
      PAYMENT_MODES_REQUIRING_PAYSTACK as readonly string[]
    ).includes(input.paymentMode);

    let payment: InitializeTransactionResult | null = null;
    let paystackReference: string | null = null;
    let initialStatus: BookingStatus = 'confirmed';

    if (requiresPaystack) {
      paystackReference = randomUUID();
      initialStatus = 'pending_payment';
      try {
        payment = await this.paystack.initializeTransaction({
          email: input.email,
          amountKobo: input.amountDueKobo,
          reference: paystackReference,
        });
      } catch (err) {
        await this.slotLock.release(lock);
        throw err;
      }
    }

    try {
      const [row] = await this.db
        .insert(bookings)
        .values({
          vendorId: input.vendorId,
          customerId,
          staffId: input.staffId,
          serviceIds: input.serviceIds,
          status: initialStatus,
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          paymentMode: input.paymentMode,
          amountDueKobo: input.amountDueKobo,
          paystackReference,
          lockToken: lock.token,
        })
        .returning();

      // pay_on_arrival skips Paystack and lands straight in `confirmed` —
      // tell the customer right away rather than waiting on a webhook.
      if (initialStatus === 'confirmed') {
        await this.push.notifyCustomer(customerId, {
          title: 'Booking confirmed',
          body: `You're all set for ${formatScheduledAt(row.scheduledAt)}.`,
        });
      }

      return { booking: row, payment };
    } catch {
      // Postgres rejected it (unique index hit) — release the lock we just took.
      // Note: a Paystack transaction may already be initialized at this point;
      // it simply expires unused since no booking will ever reference it.
      await this.slotLock.release(lock);
      throw new ConflictException(
        'This slot was just taken. Please pick another time.',
      );
    }
  }

  /**
   * PRD §6.1: a vendor's client record is "auto-created on first booking".
   * The app identity (`users`) is platform-wide; this resolves or creates the
   * per-vendor CRM record (`customers`) linked to it, so repeat bookings
   * accumulate onto one client history rather than creating duplicates.
   */
  private async findOrCreateCrmCustomer(
    vendorId: string,
    userId: string,
  ): Promise<string> {
    const [existing] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.vendorId, vendorId), eq(customers.userId, userId)),
      );
    if (existing) {
      return existing.id;
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const [created] = await this.db
      .insert(customers)
      .values({ vendorId, userId, name: user.name, email: user.email })
      .returning({ id: customers.id });
    return created.id;
  }

  /** Step 3 of §9.3: payment confirmed -> transition to `confirmed`, release the lock. */
  async confirmPayment(bookingId: string, amountPaidKobo: number) {
    return this.transition(bookingId, 'PAYMENT_SUCCEEDED', { amountPaidKobo });
  }

  /** Step 4 of §9.3: payment failed/timed out -> release the slot back to availability. */
  async failOrExpirePayment(bookingId: string) {
    return this.transition(bookingId, 'PAYMENT_FAILED_OR_TIMED_OUT');
  }

  /**
   * Resolves a `charge.success` webhook to its booking and confirms it.
   * Paystack may deliver the same event more than once (their docs say so
   * explicitly) — an already-`confirmed` booking is treated as a no-op
   * rather than an error, so retried deliveries don't 409.
   */
  async confirmPaymentByReference(reference: string, amountPaidKobo: number) {
    const booking = await this.findByPaystackReference(reference);
    if (booking.status === 'confirmed') {
      return booking;
    }
    return this.confirmPayment(booking.id, amountPaidKobo);
  }

  /** Resolves a `charge.failed` webhook to its booking and releases the slot. Idempotent for the same reason as above. */
  async failPaymentByReference(reference: string) {
    const booking = await this.findByPaystackReference(reference);
    if (!isActiveStatus(booking.status)) {
      return booking;
    }
    return this.failOrExpirePayment(booking.id);
  }

  private async findByPaystackReference(reference: string) {
    const [booking] = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.paystackReference, reference));
    if (!booking) {
      throw new NotFoundException(
        `No booking found for Paystack reference ${reference}`,
      );
    }
    return booking;
  }

  async cancelByCustomer(bookingId: string, reason?: string) {
    return this.transition(bookingId, 'CUSTOMER_CANCELLED', {
      cancellationReason: reason,
    });
  }

  /** `vendorId` scopes the action to a vendor-admin's own bookings — a mismatch 404s rather than leaking that the booking exists. */
  async cancelByVendor(bookingId: string, vendorId?: string, reason?: string) {
    return this.transition(bookingId, 'VENDOR_CANCELLED', {
      vendorId,
      cancellationReason: reason,
    });
  }

  async markCompleted(bookingId: string, vendorId?: string) {
    return this.transition(bookingId, 'MARKED_COMPLETED', { vendorId });
  }

  async markNoShow(bookingId: string, vendorId?: string) {
    return this.transition(bookingId, 'MARKED_NO_SHOW', { vendorId });
  }

  /** Vendor-admin booking list, newest first — optionally narrowed by status. */
  async listForVendor(vendorId: string, status?: BookingStatus) {
    return this.db
      .select()
      .from(bookings)
      .where(
        status
          ? and(eq(bookings.vendorId, vendorId), eq(bookings.status, status))
          : eq(bookings.vendorId, vendorId),
      )
      .orderBy(desc(bookings.scheduledAt));
  }

  /**
   * Applies a state machine event, persists the new status, and — for any
   * transition that leaves the active set (pending_payment/confirmed) —
   * releases the slot lock so the slot becomes bookable again.
   */
  private async transition(
    bookingId: string,
    event: BookingEvent,
    extra: {
      vendorId?: string;
      amountPaidKobo?: number;
      cancellationReason?: string;
    } = {},
  ) {
    const [current] = await this.db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    if (!current || (extra.vendorId && current.vendorId !== extra.vendorId)) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    let nextStatus: BookingStatus;
    try {
      nextStatus = applyBookingEvent(current.status, event);
    } catch (err) {
      if (err instanceof InvalidBookingTransitionError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    const wasActive =
      current.status === 'pending_payment' || current.status === 'confirmed';
    const isStillActive =
      nextStatus === 'pending_payment' || nextStatus === 'confirmed';

    const [updated] = await this.db
      .update(bookings)
      .set({
        status: nextStatus,
        amountPaidKobo: extra.amountPaidKobo ?? current.amountPaidKobo,
        cancellationReason:
          extra.cancellationReason ?? current.cancellationReason,
        updatedAt: new Date(),
      })
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.status, current.status)),
      )
      .returning();

    if (!updated) {
      // Someone else transitioned it between our read and write.
      throw new ConflictException(
        'Booking was modified concurrently. Please retry.',
      );
    }

    if (wasActive && !isStillActive && updated.lockToken) {
      const lockKey = this.slotLock.buildKey(
        updated.vendorId,
        updated.staffId ?? 'any',
        toIsoMinute(updated.scheduledAt),
      );
      // Compare-and-delete with our stored token: releases the slot the
      // instant we no longer need it, but never clobbers a different lock
      // someone else may have legitimately acquired after ours expired.
      await this.slotLock.release({ key: lockKey, token: updated.lockToken });
    }

    if (nextStatus === 'confirmed') {
      await this.push.notifyCustomer(updated.customerId, {
        title: 'Booking confirmed',
        body: `You're all set for ${formatScheduledAt(updated.scheduledAt)}.`,
      });
    } else if (nextStatus === 'cancelled_by_vendor') {
      await this.push.notifyCustomer(updated.customerId, {
        title: 'Booking cancelled',
        body: `Your appointment on ${formatScheduledAt(updated.scheduledAt)} was cancelled by the vendor.`,
      });
    }

    return updated;
  }
}

function toIsoMinute(date: Date): string {
  return date.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
}

function formatScheduledAt(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
