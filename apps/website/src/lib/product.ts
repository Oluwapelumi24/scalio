import { CATEGORIES } from '@/lib/constants'

/** Same names and order as the customer app. */
export const INTERESTS = CATEGORIES.map((category) => category.name)

export interface ListedVendor {
  id: string
  slug: string
  businessName: string
  category: string
  logoUrl: string | null
  themeColor: string | null
  featured: boolean
  address: string | null
  rating: number | null
  reviewCount: number | null
}

export interface ListedService {
  id: string
  name: string
  durationMinutes: number
  priceKobo: number
  paymentMode: 'pay_on_arrival' | 'deposit' | 'full_prepayment'
  depositPercent: number | null
}

export function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function shortAddress(address: string): string {
  const parts = address.split(',').map((part) => part.trim())
  return parts.length >= 2 ? parts.slice(-2).join(', ') : address
}

/** The neighbourhood part of an address: "Bariga, Shomolu, Lagos" → "Shomolu". */
export function areaOf(address: string | null): string | null {
  if (!address) return null
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? null
}

export function categoryLook(category: string): { gradient: [string, string]; label: string } {
  const key = category.toLowerCase()
  const match =
    CATEGORIES.find((item) => item.name.toLowerCase() === key) ??
    (key === 'laundromat' ? CATEGORIES.find((item) => item.name === 'Laundry') : undefined)
  return { gradient: match?.gradient ?? ['#1e3a8a', '#3f5fd9'], label: match?.name ?? category }
}

export function isLaundry(category: string) {
  const key = category.toLowerCase()
  return key === 'laundry' || key === 'laundromat'
}

export const POPULAR_AREAS = [
  'Lekki Phase 1, Lagos',
  'Victoria Island, Lagos',
  'Ikoyi, Lagos',
  'Surulere, Lagos',
  'Yaba, Lagos',
  'Ajah, Lagos',
  'Ikeja GRA, Lagos',
  'Gbagada, Lagos',
  'Maryland, Lagos',
  'Magodo, Lagos',
  'Omole Estate, Lagos',
  'Ojodu Berger, Lagos',
  'Oniru Estate, Lagos',
  'Banana Island, Lagos',
  'Lekki Phase 2, Lagos',
]
