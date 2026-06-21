export const colors = {
  primary: '#04080f',
  accent: '#1e3a8a',
  accentLight: '#dbeafe',
  background: '#ffffff',
  surface: '#f4f6fb',
  border: '#dce3f0',
  borderStrong: '#b4bfd8',
  text: '#0a0a0a',
  textSecondary: '#3a3a3a',
  textMuted: '#7a7a7a',
  disabled: '#c0c0c0',
  error: '#dc2626',
  errorLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  success: '#0d9488',
  successLight: '#ccfbf1',
  pending: '#d97706',
  pendingLight: '#fffbeb',
  cancelled: '#dc2626',
  cancelledLight: '#fef2f2',
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const typography = {
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  size: {
    xs: 11,
    sm: 13,
    base: 14,
    md: 15,
    lg: 17,
    title: 22,
    xl: 28,
  },
} as const;
