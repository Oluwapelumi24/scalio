import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingService } from './booking.service';

function selectResult(rows: unknown[]) {
  const chain: any = {
    from: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    where: jest.fn(() => Promise.resolve(rows)),
  };
  return chain;
}

function insertResult(rows: unknown[]) {
  return {
    values: jest.fn(() => ({
      returning: jest.fn(() => Promise.resolve(rows)),
    })),
  };
}

function updateResult(rows: unknown[]) {
  return {
    set: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve(rows)),
      })),
    })),
  };
}

function makeDb() {
  return { select: jest.fn(), insert: jest.fn(), update: jest.fn() };
}

function makeSlotLock() {
  return {
    buildKey: jest.fn(
      (vendorId: string, staffId: string, isoMinute: string) =>
        `slot:${vendorId}:${staffId}:${isoMinute}`,
    ),
    acquire: jest.fn(),
    release: jest.fn().mockResolvedValue(undefined),
  };
}

function makePush() {
  return { notifyCustomer: jest.fn().mockResolvedValue(undefined) };
}

function makePaystack() {
  return {
    initializeTransaction: jest.fn().mockResolvedValue({
      authorizationUrl: 'https://checkout.paystack.com/abc123',
      accessCode: 'access-code-1',
      reference: 'paystack-ref-1',
    }),
  };
}

const baseInput = {
  vendorId: 'vendor-1',
  userId: 'user-1',
  staffId: 'staff-1',
  serviceIds: ['service-1'],
  scheduledAt: new Date('2026-06-10T10:00:00Z'),
  durationMinutes: 60,
};

describe('BookingService', () => {
  // Price lookup, staff-schedule checks and CRM stats have their own tests
  // below; stubbing them keeps these tests about the booking flow itself.
  beforeEach(() => {
    jest.spyOn(BookingService.prototype as any, 'resolveBookingTerms').mockResolvedValue({ totalPriceKobo: 0 });
    jest.spyOn(BookingService.prototype as any, 'updateCustomerStats').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('createPendingBooking', () => {
    it('creates pay_on_arrival bookings straight into `confirmed`, skipping Paystack entirely', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      slotLock.acquire.mockResolvedValue({
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      });
      const bookingRow = {
        id: 'booking-1',
        status: 'confirmed',
        paystackReference: null,
        scheduledAt: baseInput.scheduledAt,
      };
      db.insert.mockReturnValueOnce(insertResult([bookingRow]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.createPendingBooking(baseInput);

      expect(result).toEqual({ booking: bookingRow });
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalledTimes(1);
      const [insertedValues] = (
        db.insert.mock.results[0].value as ReturnType<typeof insertResult>
      ).values.mock.calls[0] as unknown as [unknown];
      expect(insertedValues).toMatchObject({
        status: 'confirmed',
        paymentMode: 'pay_on_arrival',
        amountDueKobo: 0,
        paystackReference: null,
      });
    });

    it('creates a CRM customer on first booking, linked to the platform user', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select
        .mockReturnValueOnce(selectResult([])) // no existing CRM customer
        .mockReturnValueOnce(
          selectResult([
            { id: 'user-1', name: 'Jane', email: 'jane@example.com' },
          ]),
        );
      db.insert
        .mockReturnValueOnce(insertResult([{ id: 'customer-1' }]))
        .mockReturnValueOnce(
          insertResult([
            {
              id: 'booking-1',
              status: 'confirmed',
              scheduledAt: baseInput.scheduledAt,
            },
          ]),
        );
      slotLock.acquire.mockResolvedValue({
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      });

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      await service.createPendingBooking(baseInput);

      expect(db.insert).toHaveBeenNthCalledWith(1, expect.anything());
    });

    it('throws NotFoundException when the platform user does not exist', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select
        .mockReturnValueOnce(selectResult([]))
        .mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.createPendingBooking(baseInput)).rejects.toThrow(
        NotFoundException,
      );
      expect(slotLock.acquire).not.toHaveBeenCalled();
    });

    it('refuses to book a slot whose lock is already held', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      slotLock.acquire.mockResolvedValue(null);

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.createPendingBooking(baseInput)).rejects.toThrow(
        ConflictException,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('releases the freshly-acquired lock when the Postgres unique index rejects the insert', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      const lock = {
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      };
      slotLock.acquire.mockResolvedValue(lock);
      db.insert.mockReturnValueOnce({
        values: jest.fn(() => ({
          returning: jest.fn(() =>
            Promise.reject(new Error('unique violation')),
          ),
        })),
      });

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.createPendingBooking(baseInput)).rejects.toThrow(
        ConflictException,
      );
      expect(slotLock.release).toHaveBeenCalledWith(lock);
    });
  });

  describe('transition (cancel/complete/no-show/payment outcomes)', () => {
    const current = {
      id: 'booking-1',
      status: 'pending_payment',
      vendorId: 'vendor-1',
      staffId: 'staff-1',
      scheduledAt: new Date('2026-06-10T10:00:00Z'),
      lockToken: 'tok-1',
      amountPaidKobo: 0,
      cancellationReason: null,
    };

    it('applies a valid event, persists the new status, and releases the slot lock when leaving the active set', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const updated = {
        ...current,
        status: 'cancelled_by_customer',
        cancellationReason: 'change of plans',
      };
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.cancelByCustomer(
        'booking-1',
        'change of plans',
      );

      expect(result).toBe(updated);
      expect(slotLock.release).toHaveBeenCalledWith({
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      });
    });

    it('does not release the slot lock when the booking stays active (e.g. payment confirmed)', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const updated = { ...current, status: 'confirmed', amountPaidKobo: 5000 };
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      await service.confirmPayment('booking-1', 5000);

      expect(slotLock.release).not.toHaveBeenCalled();
    });

    it('rejects an event that is invalid for the booking current status', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const completed = { ...current, status: 'completed' };
      db.select.mockReturnValueOnce(selectResult([completed]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.markCompleted('booking-1')).rejects.toThrow(
        ConflictException,
      );
      expect(db.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the booking does not exist', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.markNoShow('booking-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('raises a conflict when the booking was transitioned concurrently between read and write', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([])); // optimistic-concurrency WHERE matched nothing

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(service.cancelByCustomer('booking-1')).rejects.toThrow(
        ConflictException,
      );
      expect(slotLock.release).not.toHaveBeenCalled();
    });

    it('404s rather than transitioning a booking that belongs to a different vendor', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([current])); // vendorId: 'vendor-1'

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(
        service.cancelByVendor('booking-1', 'vendor-2', 'no longer needed'),
      ).rejects.toThrow(NotFoundException);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('transitions the booking when the vendorId matches its owner', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const updated = {
        ...current,
        status: 'cancelled_by_vendor',
        cancellationReason: 'staff unavailable',
      };
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      const result = await service.cancelByVendor(
        'booking-1',
        'vendor-1',
        'staff unavailable',
      );

      expect(result).toBe(updated);
    });
  });

  describe('listForVendor', () => {
    it('lists the vendor’s bookings newest-first, optionally filtered by status', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const bookingRow = {
        id: 'booking-1', vendorId: 'vendor-1', customerId: 'cust-1', staffId: null,
        serviceIds: [], status: 'confirmed' as const, scheduledAt: new Date(),
        durationMinutes: 60, paymentMode: 'pay_on_arrival' as const,
        amountDueKobo: 0, amountPaidKobo: 0, paystackReference: null,
        cancellationReason: null, reminderSentAt: null, lockToken: null,
        createdAt: new Date(), updatedAt: new Date(),
      };
      const rows = [{ bookings: bookingRow, customers: null }];
      // Mock the second select for services lookup (empty result)
      const serviceOrderBy = jest.fn(() => Promise.resolve([]));
      const serviceWhere = jest.fn(() => ({ orderBy: serviceOrderBy }));
      const serviceFrom = jest.fn(() => ({ where: serviceWhere }));

      const orderBy = jest.fn(() => Promise.resolve(rows));
      const where = jest.fn(() => ({ orderBy }));
      const leftJoin = jest.fn(() => ({ where }));
      const from = jest.fn(() => ({ leftJoin }));
      db.select
        .mockReturnValueOnce({ from })
        .mockReturnValueOnce({ from: serviceFrom });

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      const result = await service.listForVendor('vendor-1', 'confirmed');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'booking-1', status: 'confirmed' });
      expect(where).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalled();
    });
  });

  describe('confirmPaymentByReference / failPaymentByReference (Paystack webhook)', () => {
    const pendingBooking = {
      id: 'booking-1',
      status: 'pending_payment',
      vendorId: 'vendor-1',
      staffId: 'staff-1',
      scheduledAt: new Date('2026-06-10T10:00:00Z'),
      lockToken: 'tok-1',
      amountPaidKobo: 0,
      cancellationReason: null,
      paystackReference: 'paystack-ref-1',
    };

    it('confirms the booking found by Paystack reference on charge.success', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const updated = {
        ...pendingBooking,
        status: 'confirmed',
        amountPaidKobo: 5000,
      };
      db.select
        .mockReturnValueOnce(selectResult([pendingBooking])) // findByPaystackReference
        .mockReturnValueOnce(selectResult([pendingBooking])); // transition's read-before-write
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.confirmPaymentByReference(
        'paystack-ref-1',
        5000,
      );

      expect(result).toBe(updated);
    });

    it('treats a repeated charge.success for an already-confirmed booking as a no-op (Paystack may redeliver)', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const confirmed = {
        ...pendingBooking,
        status: 'confirmed',
        amountPaidKobo: 5000,
      };
      db.select.mockReturnValueOnce(selectResult([confirmed]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.confirmPaymentByReference(
        'paystack-ref-1',
        5000,
      );

      expect(result).toBe(confirmed);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('records a first-time top-up payment on an already-confirmed booking', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const confirmed = {
        ...pendingBooking,
        status: 'confirmed',
        amountPaidKobo: 0,
      };
      const updated = { ...confirmed, amountPaidKobo: 5000 };
      db.select.mockReturnValueOnce(selectResult([confirmed]));
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.confirmPaymentByReference(
        'paystack-ref-1',
        5000,
      );

      expect(result).toBe(updated);
      expect(db.update).toHaveBeenCalledTimes(1);
      expect(slotLock.release).not.toHaveBeenCalled();
    });

    it('releases the slot when a booking fails payment via charge.failed', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const cancelled = { ...pendingBooking, status: 'cancelled_by_customer' };
      db.select
        .mockReturnValueOnce(selectResult([pendingBooking]))
        .mockReturnValueOnce(selectResult([pendingBooking]));
      db.update.mockReturnValueOnce(updateResult([cancelled]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.failPaymentByReference('paystack-ref-1');

      expect(result).toBe(cancelled);
      expect(slotLock.release).toHaveBeenCalledWith({
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      });
    });

    it('treats charge.failed for a booking that already left the active set as a no-op', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const alreadyCancelled = {
        ...pendingBooking,
        status: 'cancelled_by_customer',
      };
      db.select.mockReturnValueOnce(selectResult([alreadyCancelled]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.failPaymentByReference('paystack-ref-1');

      expect(result).toBe(alreadyCancelled);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('treats charge.failed for an already-confirmed booking (failed top-up payment) as a no-op', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const confirmed = { ...pendingBooking, status: 'confirmed' };
      db.select.mockReturnValueOnce(selectResult([confirmed]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.failPaymentByReference('paystack-ref-1');

      expect(result).toBe(confirmed);
      expect(db.update).not.toHaveBeenCalled();
      expect(slotLock.release).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no booking matches the Paystack reference', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(
        service.confirmPaymentByReference('unknown-ref', 5000),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('initiateBookingPayment', () => {
    const confirmedBooking = {
      id: 'booking-1',
      status: 'confirmed',
      customerId: 'customer-1',
      paymentMode: 'pay_on_arrival',
      amountDueKobo: 0,
    };

    it('starts a Paystack transaction for a confirmed booking and updates its payment mode', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(
        selectResult([
          { booking: confirmedBooking, email: 'jane@example.com' },
        ]),
      );
      const updated = {
        ...confirmedBooking,
        paymentMode: 'deposit',
        amountDueKobo: 5000,
        paystackReference: 'paystack-ref-1',
      };
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );
      const result = await service.initiateBookingPayment(
        'booking-1',
        'deposit',
        5000,
      );

      expect(paystack.initializeTransaction).toHaveBeenCalledWith({
        email: 'jane@example.com',
        amountKobo: 5000,
        reference: expect.any(String) as string,
      });
      expect(result).toEqual({
        booking: updated,
        payment: {
          authorizationUrl: 'https://checkout.paystack.com/abc123',
          accessCode: 'access-code-1',
          reference: 'paystack-ref-1',
        },
      });
    });

    it('throws NotFoundException when the booking does not exist', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(
        service.initiateBookingPayment('booking-1', 'deposit', 5000),
      ).rejects.toThrow(NotFoundException);
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the booking is not awaiting payment', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const paystack = makePaystack();
      const push = makePush();
      const cancelledBooking = {
        ...confirmedBooking,
        status: 'cancelled_by_customer',
      };
      db.select.mockReturnValueOnce(
        selectResult([
          { booking: cancelledBooking, email: 'jane@example.com' },
        ]),
      );

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      await expect(
        service.initiateBookingPayment('booking-1', 'deposit', 5000),
      ).rejects.toThrow(ConflictException);
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
    });
  });
});

describe('BookingService booking rules', () => {
  function service(db: any) {
    return new BookingService(db, makeSlotLock() as any, makePaystack() as any, makePush() as any);
  }
  const terms = (svc: BookingService, input: typeof baseInput) =>
    (svc as any).resolveBookingTerms(input) as Promise<{ totalPriceKobo: number }>;

  // 10:00 local on a Wednesday — `minutesSinceMidnight`/`localIsoDate` use local time.
  const wednesdayTen = new Date(2026, 5, 10, 10, 0);
  const input = { ...baseInput, scheduledAt: wednesdayTen };
  const shift = { dayOfWeek: 3, startsAtMinutes: 9 * 60, endsAtMinutes: 17 * 60, breakStartsAtMinutes: 13 * 60, breakEndsAtMinutes: 14 * 60 };

  it('captures the price of the chosen services', async () => {
    const db = makeDb();
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'staff-1' }])) // staff belongs to vendor
      .mockReturnValueOnce(selectResult([])) // no weekly pattern
      .mockReturnValueOnce(selectResult([])) // no leave
      .mockReturnValueOnce(selectResult([{ total: 1_500_000 }]));
    await expect(terms(service(db), input)).resolves.toEqual({ totalPriceKobo: 1_500_000 });
  });

  it('rejects a staff member from another business', async () => {
    const db = makeDb();
    db.select.mockReturnValueOnce(selectResult([]));
    await expect(terms(service(db), input)).rejects.toThrow('does not work at this business');
  });

  it('accepts a booking inside the staff member’s shift', async () => {
    const db = makeDb();
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'staff-1' }]))
      .mockReturnValueOnce(selectResult([shift]))
      .mockReturnValueOnce(selectResult([]))
      .mockReturnValueOnce(selectResult([{ total: 0 }]));
    await expect(terms(service(db), input)).resolves.toEqual({ totalPriceKobo: 0 });
  });

  it('rejects a booking during the staff member’s break', async () => {
    const db = makeDb();
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'staff-1' }]))
      .mockReturnValueOnce(selectResult([shift]))
      .mockReturnValueOnce(selectResult([]));
    const atOne = { ...input, scheduledAt: new Date(2026, 5, 10, 13, 0) };
    await expect(terms(service(db), atOne)).rejects.toThrow('not working at this time');
  });

  it('rejects a booking while the staff member is on leave', async () => {
    const db = makeDb();
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'staff-1' }]))
      .mockReturnValueOnce(selectResult([]))
      .mockReturnValueOnce(selectResult([{ id: 'leave-1' }]));
    await expect(terms(service(db), input)).rejects.toThrow('not working at this time');
  });

  it('rejects a booking on the staff member’s day off', async () => {
    const db = makeDb();
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'staff-1' }]))
      .mockReturnValueOnce(selectResult([{ ...shift, dayOfWeek: 1 }])) // works Mondays only
      .mockReturnValueOnce(selectResult([]));
    await expect(terms(service(db), input)).rejects.toThrow('not working at this time');
  });

  it('adds a completed visit and its value to the customer record', async () => {
    const db = makeDb();
    const set = jest.fn(() => ({ where: jest.fn(() => Promise.resolve()) }));
    db.update.mockReturnValueOnce({ set });
    await (service(db) as any).updateCustomerStats({ status: 'completed', customerId: 'c-1', totalPriceKobo: 500_000, scheduledAt: wednesdayTen });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ visitCount: expect.anything(), lifetimeValueKobo: expect.anything() }));
  });

  it('counts a no-show, and leaves other outcomes alone', async () => {
    const db = makeDb();
    const set = jest.fn(() => ({ where: jest.fn(() => Promise.resolve()) }));
    db.update.mockReturnValue({ set });
    await (service(db) as any).updateCustomerStats({ status: 'no_show', customerId: 'c-1' });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ noShowCount: expect.anything() }));
    await (service(db) as any).updateCustomerStats({ status: 'cancelled_by_vendor', customerId: 'c-1' });
    expect(db.update).toHaveBeenCalledTimes(1);
  });
});
