import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingService } from './booking.service';

function selectResult(rows: unknown[]) {
  return {
    from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })),
  };
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

function makeOtp() {
  return { verifyCode: jest.fn().mockResolvedValue(true) };
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
  email: 'jane@example.com',
  otpCode: '123456',
  staffId: 'staff-1',
  serviceIds: ['service-1'],
  scheduledAt: new Date('2026-06-10T10:00:00Z'),
  durationMinutes: 60,
  paymentMode: 'pay_on_arrival' as const,
  amountDueKobo: 0,
};

const depositInput = {
  ...baseInput,
  paymentMode: 'deposit' as const,
  amountDueKobo: 5000,
};

describe('BookingService', () => {
  describe('createPendingBooking', () => {
    it('rejects the booking when the email verification code is invalid or expired', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      otp.verifyCode.mockResolvedValue(false);

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );

      await expect(service.createPendingBooking(baseInput)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(otp.verifyCode).toHaveBeenCalledWith(
        baseInput.email,
        baseInput.otpCode,
      );
      expect(db.select).not.toHaveBeenCalled();
      expect(slotLock.acquire).not.toHaveBeenCalled();
    });

    it('creates pay_on_arrival bookings straight into `confirmed`, skipping Paystack entirely', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
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
        otp as any,
        paystack as any,
        push as any,
      );
      const result = await service.createPendingBooking(baseInput);

      expect(result).toEqual({ booking: bookingRow, payment: null });
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalledTimes(1);
      const [insertedValues] = (
        db.insert.mock.results[0].value as ReturnType<typeof insertResult>
      ).values.mock.calls[0];
      expect(insertedValues).toMatchObject({
        status: 'confirmed',
        paystackReference: null,
      });
    });

    it('starts a Paystack transaction and creates `deposit`/`full_prepayment` bookings as `pending_payment`', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      slotLock.acquire.mockResolvedValue({
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      });
      const bookingRow = {
        id: 'booking-1',
        status: 'pending_payment',
        paystackReference: 'paystack-ref-1',
      };
      db.insert.mockReturnValueOnce(insertResult([bookingRow]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );
      const result = await service.createPendingBooking(depositInput);

      expect(paystack.initializeTransaction).toHaveBeenCalledWith({
        email: depositInput.email,
        amountKobo: depositInput.amountDueKobo,
        reference: expect.any(String) as string,
      });
      expect(result).toEqual({
        booking: bookingRow,
        payment: {
          authorizationUrl: 'https://checkout.paystack.com/abc123',
          accessCode: 'access-code-1',
          reference: 'paystack-ref-1',
        },
      });
      const [insertedValues] = (
        db.insert.mock.results[0].value as ReturnType<typeof insertResult>
      ).values.mock.calls[0];
      expect(insertedValues).toMatchObject({
        status: 'pending_payment',
        paystackReference: expect.any(String) as string,
      });
    });

    it('releases the slot lock and surfaces the error when Paystack initialization fails', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      const lock = {
        key: 'slot:vendor-1:staff-1:2026-06-10T10:00',
        token: 'tok-1',
      };
      slotLock.acquire.mockResolvedValue(lock);
      paystack.initializeTransaction.mockRejectedValue(
        new Error('Paystack unreachable'),
      );

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );

      await expect(service.createPendingBooking(depositInput)).rejects.toThrow(
        'Paystack unreachable',
      );
      expect(slotLock.release).toHaveBeenCalledWith(lock);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('creates a CRM customer on first booking, linked to the platform user', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
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
              status: 'pending_payment',
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
        otp as any,
        paystack as any,
        push as any,
      );
      await service.createPendingBooking(baseInput);

      expect(db.insert).toHaveBeenNthCalledWith(1, expect.anything());
    });

    it('throws NotFoundException when the platform user does not exist', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select
        .mockReturnValueOnce(selectResult([]))
        .mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
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
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([{ id: 'customer-1' }]));
      slotLock.acquire.mockResolvedValue(null);

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
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
      const otp = makeOtp();
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
        otp as any,
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
      const otp = makeOtp();
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
        otp as any,
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
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      const updated = { ...current, status: 'confirmed', amountPaidKobo: 5000 };
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([updated]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );
      await service.confirmPayment('booking-1', 5000);

      expect(slotLock.release).not.toHaveBeenCalled();
    });

    it('rejects an event that is invalid for the booking current status', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      const completed = { ...current, status: 'completed' };
      db.select.mockReturnValueOnce(selectResult([completed]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
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
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
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
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([current]));
      db.update.mockReturnValueOnce(updateResult([])); // optimistic-concurrency WHERE matched nothing

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );

      await expect(service.cancelByCustomer('booking-1')).rejects.toThrow(
        ConflictException,
      );
      expect(slotLock.release).not.toHaveBeenCalled();
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
      const otp = makeOtp();
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
        otp as any,
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
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      const confirmed = { ...pendingBooking, status: 'confirmed' };
      db.select.mockReturnValueOnce(selectResult([confirmed]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
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

    it('releases the slot when a booking fails payment via charge.failed', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
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
        otp as any,
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
      const otp = makeOtp();
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
        otp as any,
        paystack as any,
        push as any,
      );
      const result = await service.failPaymentByReference('paystack-ref-1');

      expect(result).toBe(alreadyCancelled);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no booking matches the Paystack reference', async () => {
      const db = makeDb();
      const slotLock = makeSlotLock();
      const otp = makeOtp();
      const paystack = makePaystack();
      const push = makePush();
      db.select.mockReturnValueOnce(selectResult([]));

      const service = new BookingService(
        db as any,
        slotLock as any,
        otp as any,
        paystack as any,
        push as any,
      );

      await expect(
        service.confirmPaymentByReference('unknown-ref', 5000),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
