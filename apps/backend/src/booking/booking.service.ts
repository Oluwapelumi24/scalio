import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, users, vendors, services } from '../db/schema';
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
} from './booking-state-machine';

export interface CreatePendingBookingInput {
  vendorId: string;
  /** The signed-up app user booking this appointment — resolved/linked to a per-vendor CRM record. */
  userId: string;
  staffId: string | null;
  serviceIds: string[];
  scheduledAt: Date;
  durationMinutes: number;
}

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly slotLock: SlotLockService,
    private readonly paystack: PaystackService,
    private readonly push: PushService,
  ) {}

  /**
   * Acquires the Redis lock for this slot, then creates the booking straight
   * into `confirmed` with `pay_on_arrival` — no money or payment provider is
   * involved at booking time. The Postgres partial unique index is the
   * backstop if Redis is unavailable or the lock already expired. The
   * customer can optionally upgrade to a deposit/full prepayment afterwards
   * via `initiateBookingPayment`.
   */
  async createPendingBooking(input: CreatePendingBookingInput): Promise<{
    booking: typeof bookings.$inferSelect;
  }> {
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

    try {
      const [row] = await this.db
        .insert(bookings)
        .values({
          vendorId: input.vendorId,
          customerId,
          staffId: input.staffId,
          serviceIds: input.serviceIds,
          status: 'confirmed',
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          paymentMode: 'pay_on_arrival',
          amountDueKobo: 0,
          paystackReference: null,
          lockToken: lock.token,
        })
        .returning();

      await this.push.notifyCustomer(customerId, {
        title: 'Booking confirmed',
        body: `You're all set for ${formatScheduledAt(row.scheduledAt)}.`,
      });

      return { booking: row };
    } catch {
      // Postgres rejected it (unique index hit) — release the lock we just took.
      await this.slotLock.release(lock);
      throw new ConflictException(
        'This slot was just taken. Please pick another time.',
      );
    }
  }

  /**
   * Lets a customer upgrade an already-`confirmed` (pay-on-arrival) booking to
   * `deposit`/`full_prepayment` by starting a Paystack transaction. The
   * booking stays `confirmed` regardless of how this payment turns out — it's
   * an optional add-on, not a gate on the slot.
   */
  async initiateBookingPayment(
    bookingId: string,
    paymentMode: 'deposit' | 'full_prepayment',
    amountDueKobo: number,
  ): Promise<{
    booking: typeof bookings.$inferSelect;
    payment: InitializeTransactionResult;
  }> {
    const [row] = await this.db
      .select({ booking: bookings, email: users.email })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(bookings.id, bookingId));

    if (!row) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    if (row.booking.status !== 'confirmed') {
      throw new ConflictException(
        `Booking ${bookingId} is not awaiting payment`,
      );
    }

    const reference = randomUUID();
    const payment = await this.paystack.initializeTransaction({
      email: row.email,
      amountKobo: amountDueKobo,
      reference,
    });

    const [updated] = await this.db
      .update(bookings)
      .set({
        paymentMode,
        amountDueKobo,
        paystackReference: reference,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    return { booking: updated, payment };
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
   * Resolves a `charge.success` webhook to its booking. A `pending_payment`
   * booking (legacy rows created before payment moved post-booking) is
   * confirmed via the state machine as before. A booking that's already
   * `confirmed` only gets here from an optional post-booking top-up payment —
   * its `amountPaidKobo` is simply recorded. Paystack may deliver the same
   * event more than once (their docs say so explicitly), so an event whose
   * amount was already recorded is treated as a no-op.
   */
  async confirmPaymentByReference(reference: string, amountPaidKobo: number) {
    const booking = await this.findByPaystackReference(reference);
    if (booking.status === 'pending_payment') {
      return this.confirmPayment(booking.id, amountPaidKobo);
    }
    if (booking.amountPaidKobo >= amountPaidKobo) {
      return booking;
    }
    return this.recordPayment(booking.id, amountPaidKobo);
  }

  /**
   * Resolves a `charge.failed` webhook to its booking and releases the slot —
   * but only for `pending_payment` bookings (legacy rows where payment gated
   * the booking itself). A booking that's already `confirmed` only gets here
   * from a failed optional top-up payment, which must never cancel an
   * already-secured booking, so it's a no-op.
   */
  async failPaymentByReference(reference: string) {
    const booking = await this.findByPaystackReference(reference);
    if (booking.status !== 'pending_payment') {
      return booking;
    }
    return this.failOrExpirePayment(booking.id);
  }

  /** Records a successful post-booking top-up payment without touching `status`. */
  private async recordPayment(bookingId: string, amountPaidKobo: number) {
    const [updated] = await this.db
      .update(bookings)
      .set({ amountPaidKobo, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
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
    const rows = await this.db
      .select()
      .from(bookings)
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .where(
        status
          ? and(eq(bookings.vendorId, vendorId), eq(bookings.status, status))
          : eq(bookings.vendorId, vendorId),
      )
      .orderBy(desc(bookings.scheduledAt));

    const allServiceIds = [...new Set(rows.flatMap((r) => r.bookings.serviceIds))];
    const serviceRows =
      allServiceIds.length > 0
        ? await this.db
            .select()
            .from(services)
            .where(inArray(services.id, allServiceIds))
        : [];
    const serviceMap = new Map(serviceRows.map((s) => [s.id, s]));

    return rows.map(({ bookings: b, customers: c }) => ({
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt,
      durationMinutes: b.durationMinutes,
      paymentMode: b.paymentMode,
      totalAmountKobo: b.amountDueKobo,
      customer: c ? { id: c.id, name: c.name, email: c.email } : null,
      services: b.serviceIds
        .map((id) => serviceMap.get(id))
        .filter((s): s is NonNullable<typeof s> => s != null)
        .map((s) => ({ id: s.id, name: s.name, priceKobo: s.priceKobo })),
      notes: b.cancellationReason,
      createdAt: b.createdAt,
    }));
  }

  /** This app user's bookings across every vendor, newest first, with the vendor they're for. */
  async listForUser(userId: string) {
    return this.db
      .select({ booking: bookings, vendor: vendors })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .where(eq(customers.userId, userId))
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
