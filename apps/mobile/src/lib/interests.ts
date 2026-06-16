export const INTERESTS = [
  'Salon',
  'Barbershop',
  'Nails',
  'Wig & Hair Extensions',
  'Makeup',
  'Spa',
  'Massage',
  'Fitness & Wellness',
  'Healthcare',
  'Lashes & Brows',
  'Tutors & Coaching',
  'Photography',
  'Laundromat',
  'Cleaning',
] as const;

export type Interest = (typeof INTERESTS)[number];
