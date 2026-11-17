/** Same names customers browse by on the website. */
export const BUSINESS_CATEGORIES = [
  'Spa',
  'Laundry',
  'Tailoring',
  'Salon',
  'Cleaning',
  'Massage',
  'Pilates',
  'Fitness',
  'Barbershop',
  'Physio',
  'Makeup',
  'Nails',
  'Lashes & Brows',
  'Hair Styling',
  'Wig & Hair Extensions',
] as const

export interface VendorProfile {
  businessName: string
  category: string
  address: string | null
  description: string | null
  approvalStatus: 'pending_review' | 'approved' | 'rejected'
  reviewNote: string | null
  slug: string
}

export function listingReady(profile: VendorProfile | null): boolean {
  return !!profile && profile.category !== 'Other' && !!profile.address?.trim()
}
