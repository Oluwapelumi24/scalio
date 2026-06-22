export const INTERESTS = [
  'Salon',
  'Barbershop',
  'Hair Styling',
  'Nails',
  'Wig & Hair Extensions',
  'Makeup',
  'Spa',
  'Massage',
  'Lashes & Brows',
  'Photography',
  'Laundry',
  'Cleaning',
  'Studio',
] as const;

export type Interest = (typeof INTERESTS)[number];
