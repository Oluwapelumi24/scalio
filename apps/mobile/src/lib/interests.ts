export const INTERESTS = [
  'Salon',
  'Nails',
  'Lashes',
  'Spa',
  'Barbing',
  'Massage',
  'Makeup',
  'Brows',
] as const;

export type Interest = (typeof INTERESTS)[number];
