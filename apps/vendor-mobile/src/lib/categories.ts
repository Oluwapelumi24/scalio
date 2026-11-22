/**
 * Same browse categories as @veno/shared-types / the web dashboard.
 * Keep in sync when the shared list changes (Expo metro prefers a local copy).
 */
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
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
