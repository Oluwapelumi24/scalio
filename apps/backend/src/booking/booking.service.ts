import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, inArray, lt, sql, sum } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, users, vendors, services, staff, vendorPayoutAccounts } from '../db/schema';
import {
  PaystackService,
  type InitializeTransactionResult,
} from '../payments/paystack.service';
import { FeedbackService } from '../feedback/feedback.service';
import { PushService } from '../notifications/push.service';
import { SlotLockService } from './slot-lock.service';
import { loadStaffDay } from '../staff-schedule/staff-day';
import { fitsWorkingWindow, localIsoDate, minutesSinceMidnight, staffWorkingWindow } from '../vendor/availability';
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

/** A booking a staff member makes for a client: a walk-in, a phone call, a DM. */
export interface CreateVendorBookingInput {
  vendorId: string;
  /** An existing client of this business… */
  customerId?: string;
  /** …or the details of a new one. */
  newCustomer?: { name: string; phone?: string; email?: string };
  staffId: string | null;
  serviceIds: string[];
  scheduledAt: Date;
}

/** What the booking rules need to know, whoever is making the booking. */
type BookingTermsInput = Pick<CreatePendingBookingInput, 'vendorId' | 'staffId' | 'serviceIds' | 'scheduledAt' | 'durationMinutes'>;

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly slotLock: SlotLockService,
    private readonly paystack: PaystackService,
    private readonly push: PushService,
    @Optional() private readonly feedback?: FeedbackService,
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
    const { totalPriceKobo } = await this.resolveBookingTerms(input);
    const customerId = await this.findOrCreateCrmCustomer(
      input.vendorId,
      input.userId,
    );

    const booking = await this.insertConfirmed({ ...input, customerId, totalPriceKobo });
    return { booking };
  }

  /**
   * Books a client in from the business side. The client is either one the
   * business already has, or a new walk-in record (matched on phone so the
   * same person isn't added twice). Duration comes from the chosen services,
   * and the same staff and slot rules apply as for online bookings.
   */
  async createByVendor(input: CreateVendorBookingInput): Promise<typeof bookings.$inferSelect> {
    const serviceIds = [...new Set(input.serviceIds)];
    if (serviceIds.length === 0) throw new BadRequestException('Pick at least one service.');
    const chosen = await this.db
      .select({ id: services.id, durationMinutes: services.durationMinutes })
      .from(services)
      .where(and(eq(services.vendorId, input.vendorId), inArray(services.id, serviceIds)));
    if (chosen.length !== serviceIds.length) {
      throw new BadRequestException('One of those services is not offered by this business.');
    }
    const durationMinutes = chosen.reduce((total, s) => total + s.durationMinutes, 0);

    const terms = { ...input, serviceIds, durationMinutes };
    const { totalPriceKobo } = await this.resolveBookingTerms(terms);
    const customerId = await this.resolveClient(input);
    return this.insertConfirmed({ ...terms, customerId, totalPriceKobo });
  }

  /** The client a staff-made booking is for: an existing record of this business, or a new walk-in. */
  private async resolveClient(input: CreateVendorBookingInput): Promise<string> {
    if (input.customerId) {
      const [existing] = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, input.customerId), eq(customers.vendorId, input.vendorId)));
      if (!existing) throw new NotFoundException('That client was not found.');
      return existing.id;
    }

    const name = input.newCustomer?.name.trim();
    if (!name) throw new BadRequestException('Add the client’s name, or pick an existing client.');
    const phone = input.newCustomer?.phone?.trim() || null;
    if (phone) {
      const [samePhone] = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.vendorId, input.vendorId), eq(customers.phone, phone)));
      if (samePhone) return samePhone.id;
    }
    const [created] = await this.db
      .insert(customers)
      .values({ vendorId: input.vendorId, name, phone, email: input.newCustomer?.email?.trim() || null })
      .returning({ id: customers.id });
    return created.id;
  }

  /**
   * Holds the slot in Redis, then writes the booking straight into `confirmed`
   * with `pay_on_arrival`. The Postgres partial unique index is the backstop if
   * Redis is unavailable or the lock already expired.
   */
  private async insertConfirmed(
    input: BookingTermsInput & { customerId: string; totalPriceKobo: number },
  ): Promise<typeof bookings.$inferSelect> {
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
          customerId: input.customerId,
          staffId: input.staffId,
          serviceIds: input.serviceIds,
          status: 'confirmed',
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          paymentMode: 'pay_on_arrival',
          amountDueKobo: 0,
          totalPriceKobo: input.totalPriceKobo,
          paystackReference: null,
          lockToken: lock.token,
        })
        .returning();

      await this.push.notifyCustomer(input.customerId, {
        title: 'Booking confirmed',
        body: `You're all set for ${formatScheduledAt(row.scheduledAt)}.`,
      });

      return row;
    } catch {
      // Postgres rejected it (unique index hit) — release the lock we just took.
      await this.slotLock.release(lock);
      throw new ConflictException(
        'This slot was just taken. Please pick another time.',
      );
    }
  }

  /**
   * Checks what the booking is allowed to be before anything is locked or
   * written: the staff member (if one was picked) belongs to this business and
   * is working at that time, and the price of the chosen services is captured
   * so sales figures don't depend on later price changes.
   */
  private async resolveBookingTerms(input: BookingTermsInput): Promise<{ totalPriceKobo: number }> {
    if (input.staffId) {
      const [member] = await this.db
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.id, input.staffId), eq(staff.vendorId, input.vendorId)));
      if (!member) throw new BadRequestException('That staff member does not work at this business.');

      const day = await loadStaffDay(this.db, input.staffId, localIsoDate(input.scheduledAt));
      // Staff with no pattern and no leave keep the old behaviour: business hours apply.
      if (day.hasSchedule || day.onTimeOff) {
        const window = staffWorkingWindow({ startMinutes: 0, endMinutes: 24 * 60 }, day);
        if (!window || !fitsWorkingWindow(window, minutesSinceMidnight(input.scheduledAt), input.durationMinutes)) {
          throw new ConflictException('That staff member is not working at this time. Please pick another time.');
        }
      }
    }

    const [price] = await this.db
      .select({ total: sum(services.priceKobo).mapWith(Number) })
      .from(services)
      .where(and(eq(services.vendorId, input.vendorId), inArray(services.id, input.serviceIds)));
    return { totalPriceKobo: price?.total ?? 0 };
  }

  /** The vendor's Paystack subaccount code, or null if they haven't set up payouts. */
  private async paymentAccountFor(vendorId: string): Promise<string | null> {
    const [acct] = await this.db
      .select({ code: vendorPayoutAccounts.paystackSubaccountCode })
      .from(vendorPayoutAccounts)
      .where(eq(vendorPayoutAccounts.vendorId, vendorId));
    return acct?.code ?? null;
  }

  /**
   * Keeps the CRM record's visit history true to what happened. Runs once per
   * booking: the status update before it only succeeds for one caller.
   */
  private async updateCustomerStats(booking: typeof bookings.$inferSelect) {
    if (booking.status === 'completed') {
      await this.db
        .update(customers)
        .set({
          visitCount: sql`${customers.visitCount} + 1`,
          lifetimeValueKobo: sql`${customers.lifetimeValueKobo} + ${booking.totalPriceKobo}`,
          lastVisitAt: sql`greatest(${customers.lastVisitAt}, ${booking.scheduledAt})`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, booking.customerId));
    } else if (booking.status === 'no_show') {
      await this.db
        .update(customers)
        .set({ noShowCount: sql`${customers.noShowCount} + 1`, updatedAt: new Date() })
        .where(eq(customers.id, booking.customerId));
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
    // The amount comes from the client, so it's checked against the booking's price.
    const price = row.booking.totalPriceKobo;
    if (price > 0) {
      if (paymentMode === 'full_prepayment' && amountDueKobo !== price) {
        throw new BadRequestException('Full payment must match the booking price.');
      }
      if (paymentMode === 'deposit' && amountDueKobo > price) {
        throw new BadRequestException('A deposit cannot be more than the booking price.');
      }
    }
    // Online payments settle straight to the vendor's own bank via their Paystack
    // subaccount. Without one, Scalio would be holding the money, so don't take it.
    const subaccountCode = await this.paymentAccountFor(row.booking.vendorId);
    if (!subaccountCode) {
      throw new ConflictException(
        "This business isn't set up to take online payments yet. You can pay at the appointment.",
      );
    }

    const reference = randomUUID();
    const payment = await this.paystack.initializeTransaction({
      email: row.email,
      amountKobo: amountDueKobo,
      reference,
      subaccountCode,
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

  /**
   * Vendor-admin booking list, newest first — optionally narrowed by status,
   * staff member, or a time window (`from` inclusive, `to` exclusive) for the calendar.
   */
  async listForVendor(vendorId: string, status?: BookingStatus, staffId?: string, range?: { from?: Date; to?: Date }) {
    const conditions = [eq(bookings.vendorId, vendorId)];
    if (status) conditions.push(eq(bookings.status, status));
    if (staffId) conditions.push(eq(bookings.staffId, staffId));
    if (range?.from) conditions.push(gte(bookings.scheduledAt, range.from));
    if (range?.to) conditions.push(lt(bookings.scheduledAt, range.to));

    const rows = await this.db
      .select()
      .from(bookings)
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .where(and(...conditions))
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

    const staffIds = [...new Set(rows.map((r) => r.bookings.staffId).filter((id): id is string => id != null))];
    const staffRows =
      staffIds.length > 0
        ? await this.db.select({ id: staff.id, name: staff.name }).from(staff).where(inArray(staff.id, staffIds))
        : [];
    const staffMap = new Map(staffRows.map((m) => [m.id, m]));

    return rows.map(({ bookings: b, customers: c }) => ({
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt,
      durationMinutes: b.durationMinutes,
      paymentMode: b.paymentMode,
      totalAmountKobo: b.totalPriceKobo,
      customer: c ? { id: c.id, name: c.name, email: c.email } : null,
      staff: b.staffId ? (staffMap.get(b.staffId) ?? null) : null,
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

    await this.updateCustomerStats(updated);

    if (nextStatus === 'completed') {
      await this.feedback?.requestForBooking(updated.id);
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
