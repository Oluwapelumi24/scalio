import type { Service } from '@scalio/shared-types';

export const PAYMENT_MODE_PRIORITY = {
  pay_on_arrival: 0,
  deposit: 1,
  full_prepayment: 2,
} as const;

// Used when a service doesn't require a deposit but the customer voluntarily
// chooses the "pay part now" option.
export const DEFAULT_DEPOSIT_PERCENT = 50;

// The strictest mode required by any selected service — the floor a customer
// can't pay less than (they can still choose to pay more for convenience).
export function resolveMinimumPaymentMode(services: Service[]): Service['paymentMode'] {
  let mode: Service['paymentMode'] = 'pay_on_arrival';
  for (const service of services) {
    if (PAYMENT_MODE_PRIORITY[service.paymentMode] > PAYMENT_MODE_PRIORITY[mode]) {
      mode = service.paymentMode;
    }
  }
  return mode;
}

export function amountForPaymentMode(services: Service[], mode: Service['paymentMode']): number {
  if (mode === 'pay_on_arrival') return 0;
  if (mode === 'full_prepayment') {
    return services.reduce((sum, service) => sum + service.priceKobo, 0);
  }
  return services.reduce(
    (sum, service) =>
      sum + Math.round((service.priceKobo * (service.depositPercent ?? DEFAULT_DEPOSIT_PERCENT)) / 100),
    0,
  );
}
