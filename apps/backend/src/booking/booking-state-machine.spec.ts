import {
  applyBookingEvent,
  InvalidBookingTransitionError,
  isActiveStatus,
} from './booking-state-machine';

describe('booking state machine', () => {
  it('confirms a pending booking on payment success', () => {
    expect(applyBookingEvent('pending_payment', 'PAYMENT_SUCCEEDED')).toBe('confirmed');
  });

  it('releases a pending booking back to availability on payment failure or timeout', () => {
    expect(applyBookingEvent('pending_payment', 'PAYMENT_FAILED_OR_TIMED_OUT')).toBe(
      'cancelled_by_customer',
    );
  });

  it('lets a confirmed booking move to completed, no-show, or either cancellation', () => {
    expect(applyBookingEvent('confirmed', 'MARKED_COMPLETED')).toBe('completed');
    expect(applyBookingEvent('confirmed', 'MARKED_NO_SHOW')).toBe('no_show');
    expect(applyBookingEvent('confirmed', 'CUSTOMER_CANCELLED')).toBe('cancelled_by_customer');
    expect(applyBookingEvent('confirmed', 'VENDOR_CANCELLED')).toBe('cancelled_by_vendor');
  });

  it('rejects events that do not apply to the current status', () => {
    expect(() => applyBookingEvent('pending_payment', 'MARKED_COMPLETED')).toThrow(
      InvalidBookingTransitionError,
    );
    expect(() => applyBookingEvent('confirmed', 'PAYMENT_SUCCEEDED')).toThrow(
      InvalidBookingTransitionError,
    );
  });

  it('treats terminal statuses as dead ends — no event moves them anywhere', () => {
    const terminal = ['completed', 'cancelled_by_customer', 'cancelled_by_vendor', 'no_show'] as const;
    const events = [
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED_OR_TIMED_OUT',
      'CUSTOMER_CANCELLED',
      'VENDOR_CANCELLED',
      'MARKED_COMPLETED',
      'MARKED_NO_SHOW',
    ] as const;

    for (const status of terminal) {
      for (const event of events) {
        expect(() => applyBookingEvent(status, event)).toThrow(InvalidBookingTransitionError);
      }
    }
  });

  it('reports active (slot-occupying) statuses correctly', () => {
    expect(isActiveStatus('pending_payment')).toBe(true);
    expect(isActiveStatus('confirmed')).toBe(true);
    expect(isActiveStatus('completed')).toBe(false);
    expect(isActiveStatus('cancelled_by_customer')).toBe(false);
    expect(isActiveStatus('cancelled_by_vendor')).toBe(false);
    expect(isActiveStatus('no_show')).toBe(false);
  });
});
