// Shared design tokens consolidating the palette/spacing/type scale that was
// previously hardcoded per-screen. Category/vendor accent colors (see
// `lib/categories.ts`'s `CATEGORY_META`/`getVendorAccentColor`) are for icon
// tints, badges, and borders only — do not use them for body text, several
// don't meet contrast requirements on a white background.

export const colors = {
  primary: '#111111',
  background: '#ffffff',
  border: '#eeeeee',
  borderStrong: '#dddddd',
  textMuted: '#777777',
  textSecondary: '#555555',
  textFaint: '#999999',
  textBody: '#333333',
  disabled: '#cccccc',
  error: '#b00020',
  pending: '#b8860b',
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const typography = {
  weight: {
    regular: '400',
    semibold: '600',
    bold: '700',
  },
  size: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    title: 24,
    display: 28,
  },
} as const;
