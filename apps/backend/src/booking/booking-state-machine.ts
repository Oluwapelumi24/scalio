import { bookingStatusValues } from '../db/schema';

export type BookingStatus = (typeof bookingStatusValues)[number];

export type BookingEvent =
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED_OR_TIMED_OUT'
  | 'CUSTOMER_CANCELLED'
  | 'VENDOR_CANCELLED'
  | 'MARKED_COMPLETED'
  | 'MARKED_NO_SHOW';

/**
 * Pure transition table per PRD §9.3/§5.5. Kept free of I/O so it can be
 * exhaustively unit-tested — a wrong transition here corrupts every
 * downstream feature (refunds, CRM stats, re-engagement triggers).
 */
const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingEvent, BookingStatus>>> = {
  pending_payment: {
    PAYMENT_SUCCEEDED: 'confirmed',
    PAYMENT_FAILED_OR_TIMED_OUT: 'cancelled_by_customer',
    CUSTOMER_CANCELLED: 'cancelled_by_customer',
    VENDOR_CANCELLED: 'cancelled_by_vendor',
  },
  confirmed: {
    CUSTOMER_CANCELLED: 'cancelled_by_customer',
    VENDOR_CANCELLED: 'cancelled_by_vendor',
    MARKED_COMPLETED: 'completed',
    MARKED_NO_SHOW: 'no_show',
  },
  completed: {},
  cancelled_by_customer: {},
  cancelled_by_vendor: {},
  no_show: {},
};

/** Statuses that hold a slot. Anything else has released it (mirrors the DB partial unique index). */
export const ACTIVE_STATUSES: readonly BookingStatus[] = ['pending_payment', 'confirmed'];

export function isActiveStatus(status: BookingStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export class InvalidBookingTransitionError extends Error {
  constructor(from: BookingStatus, event: BookingEvent) {
    super(`Cannot apply event "${event}" to booking in status "${from}"`);
    this.name = 'InvalidBookingTransitionError';
  }
}

/** Returns the resulting status, or throws if the event isn't valid from the current status. */
export function applyBookingEvent(current: BookingStatus, event: BookingEvent): BookingStatus {
  const next = TRANSITIONS[current][event];
  if (!next) {
    throw new InvalidBookingTransitionError(current, event);
  }
  return next;
}
