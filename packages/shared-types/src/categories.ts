/** Categories customers browse by. Keep identical across website, vendor, admin, and API. */
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

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]
