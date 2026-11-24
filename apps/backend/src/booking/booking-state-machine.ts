import { BOOKING, BOOKING_HOLDS_SLOT, move, type BookingEvent } from '@veno/shared-types';
import { bookingStatusValues } from '../db/schema';

export type { BookingEvent };
export type BookingStatus = (typeof bookingStatusValues)[number];

/**
 * The table lives in @veno/shared-types so the customer app, the vendor app,
 * and the admin app read the same steps. This file only throws the error
 * the booking service already turns into a 409.
 */

/** Statuses that hold a slot. Anything else has released it (mirrors the DB partial unique index). */
export const ACTIVE_STATUSES: readonly BookingStatus[] = BOOKING_HOLDS_SLOT;

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
  const next = move(BOOKING, current, event);
  if (!next) {
    throw new InvalidBookingTransitionError(current, event);
  }
  return next;
}
