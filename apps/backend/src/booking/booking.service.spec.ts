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
      ).values.mock.calls[0];
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
      const rows = [{ id: 'booking-2' }, { id: 'booking-1' }];
      const orderBy = jest.fn(() => Promise.resolve(rows));
      const where = jest.fn(() => ({ orderBy }));
      const from = jest.fn(() => ({ where }));
      db.select.mockReturnValueOnce({ from });

      const service = new BookingService(
        db as any,
        slotLock as any,
        paystack as any,
        push as any,
      );

      const result = await service.listForVendor('vendor-1', 'confirmed');

      expect(result).toBe(rows);
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
