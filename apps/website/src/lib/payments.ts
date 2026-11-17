export type PaymentMode = 'pay_on_arrival' | 'deposit' | 'full_prepayment'

export const PAYMENT_MODE_PRIORITY: Record<PaymentMode, number> = {
  pay_on_arrival: 0,
  deposit: 1,
  full_prepayment: 2,
}

const DEFAULT_DEPOSIT_PERCENT = 50

export interface PayableService {
  priceKobo: number
  paymentMode: PaymentMode
  depositPercent: number | null
}

export function minimumPaymentMode(services: PayableService[]): PaymentMode {
  let mode: PaymentMode = 'pay_on_arrival'
  for (const service of services) {
    if (PAYMENT_MODE_PRIORITY[service.paymentMode] > PAYMENT_MODE_PRIORITY[mode]) mode = service.paymentMode
  }
  return mode
}

export function amountForMode(services: PayableService[], mode: PaymentMode): number {
  if (mode === 'pay_on_arrival') return 0
  if (mode === 'full_prepayment') return services.reduce((sum, service) => sum + service.priceKobo, 0)
  return services.reduce(
    (sum, service) => sum + Math.round((service.priceKobo * (service.depositPercent ?? DEFAULT_DEPOSIT_PERCENT)) / 100),
    0,
  )
}
