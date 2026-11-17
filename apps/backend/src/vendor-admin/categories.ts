/** The categories customers browse. A listing in "Other" does not show up in those lists. */
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
