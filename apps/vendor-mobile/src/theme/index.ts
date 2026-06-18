export const colors = {
  primary: '#1e293b',
  accent: '#059669',
  accentLight: '#d1fae5',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  disabled: '#cbd5e1',
  error: '#dc2626',
  errorLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  success: '#059669',
  successLight: '#d1fae5',
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
