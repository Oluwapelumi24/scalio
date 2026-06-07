import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, users } from '../db/schema';
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
  paymentMode: 'pay_on_arrival' | 'deposit' | 'full_prepayment';
  amountDueKobo: number;
}

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly slotLock: SlotLockService,
  ) {}

  /**
   * Step 1-2 of PRD §9.3: acquire the Redis lock for this slot, then create
   * the booking in `pending_payment`. The Postgres partial unique index is
   * the backstop if Redis is unavailable or the lock already expired.
   */
  async createPendingBooking(input: CreatePendingBookingInput) {
    const customerId = await this.findOrCreateCrmCustomer(input.vendorId, input.userId);

    const lockKey = this.slotLock.buildKey(
      input.vendorId,
      input.staffId ?? 'any',
      toIsoMinute(input.scheduledAt),
    );
    const lock = await this.slotLock.acquire(lockKey);
    if (!lock) {
      throw new ConflictException('This slot was just taken. Please pick another time.');
    }

    try {
      const [row] = await this.db
        .insert(bookings)
        .values({
          vendorId: input.vendorId,
          customerId,
          staffId: input.staffId,
          serviceIds: input.serviceIds,
          status: 'pending_payment',
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          paymentMode: input.paymentMode,
          amountDueKobo: input.amountDueKobo,
          lockToken: lock.token,
        })
        .returning();
      return row;
    } catch (err) {
      // Postgres rejected it (unique index hit) — release the lock we just took.
      await this.slotLock.release(lock);
      throw new ConflictException('This slot was just taken. Please pick another time.');
    }
  }

  /**
   * PRD §6.1: a vendor's client record is "auto-created on first booking".
   * The app identity (`users`) is platform-wide; this resolves or creates the
   * per-vendor CRM record (`customers`) linked to it, so repeat bookings
   * accumulate onto one client history rather than creating duplicates.
   */
  private async findOrCreateCrmCustomer(vendorId: string, userId: string): Promise<string> {
    const [existing] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.vendorId, vendorId), eq(customers.userId, userId)));
    if (existing) {
      return existing.id;
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
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

  async cancelByCustomer(bookingId: string, reason?: string) {
    return this.transition(bookingId, 'CUSTOMER_CANCELLED', { cancellationReason: reason });
  }

  async cancelByVendor(bookingId: string, reason?: string) {
    return this.transition(bookingId, 'VENDOR_CANCELLED', { cancellationReason: reason });
  }

  async markCompleted(bookingId: string) {
    return this.transition(bookingId, 'MARKED_COMPLETED');
  }

  async markNoShow(bookingId: string) {
    return this.transition(bookingId, 'MARKED_NO_SHOW');
  }

  /**
   * Applies a state machine event, persists the new status, and — for any
   * transition that leaves the active set (pending_payment/confirmed) —
   * releases the slot lock so the slot becomes bookable again.
   */
  private async transition(
    bookingId: string,
    event: BookingEvent,
    extra: { amountPaidKobo?: number; cancellationReason?: string } = {},
  ) {
    const [current] = await this.db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!current) {
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

    const wasActive = current.status === 'pending_payment' || current.status === 'confirmed';
    const isStillActive = nextStatus === 'pending_payment' || nextStatus === 'confirmed';

    const [updated] = await this.db
      .update(bookings)
      .set({
        status: nextStatus,
        amountPaidKobo: extra.amountPaidKobo ?? current.amountPaidKobo,
        cancellationReason: extra.cancellationReason ?? current.cancellationReason,
        updatedAt: new Date(),
      })
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, current.status)))
      .returning();

    if (!updated) {
      // Someone else transitioned it between our read and write.
      throw new ConflictException('Booking was modified concurrently. Please retry.');
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

    return updated;
  }
}

function toIsoMinute(date: Date): string {
  return date.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
}
