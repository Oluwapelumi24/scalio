// Same services, names and order as the website (apps/website/src/lib/constants.ts).
export const INTERESTS = [
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

export type Interest = (typeof INTERESTS)[number];
