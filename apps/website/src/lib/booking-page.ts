export interface PublicService {
  id: string
  name: string
  serviceType: 'package' | 'service'
  durationMinutes: number
  priceKobo: number
  paymentMode: 'pay_on_arrival' | 'deposit' | 'full_prepayment'
  depositPercent: number | null
}

export interface PublicVendor {
  id: string
  slug: string
  businessName: string
  category: string
  description: string | null
  address: string | null
  logoUrl: string | null
  themeColor: string | null
  rating: number | null
  reviewCount: number | null
  timezone: string
  services: PublicService[]
  businessHours: { dayOfWeek: number; opensAtMinutes: number; closesAtMinutes: number }[]
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

export function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = (minutes % 60).toString().padStart(2, '0')
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${((h + 11) % 12) + 1}:${m}${suffix}`
}

export const PAYMENT_LABEL: Record<PublicService['paymentMode'], (s: PublicService) => string> = {
  pay_on_arrival: () => 'Pay at the appointment',
  deposit: (s) => (s.depositPercent ? `${s.depositPercent}% deposit to book` : 'Deposit to book'),
  full_prepayment: () => 'Pay in full to book',
}
