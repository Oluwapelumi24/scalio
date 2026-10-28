import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Two palettes with the same names, so every screen works in both. Scalio navy
 * is the one accent and the only call-to-action colour: every filled button,
 * selected chip, link and the active tab. Black/white is for text, icons and
 * outlined buttons only. In dark mode navy lifts to a brighter shade so it
 * still reads on near-black, and button text stays white in both themes.
 */
const light = {
  // Filled buttons and selected chips: navy with white text (same as accent).
  primary: '#1e3a8a',
  onPrimary: '#ffffff',
  accent: '#1e3a8a',
  onAccent: '#ffffff',
  /** Accent for text and icons (links, "Learn more", active tab). */
  link: '#1e3a8a',
  accentLight: '#e8edfa',
  background: '#ffffff',
  /** Raised areas: fields, sheets, segmented controls. */
  surface: '#f5f6f8',
  card: '#ffffff',
  border: '#e4e6eb',
  borderStrong: '#c9ced8',
  text: '#0a0a0a',
  textSecondary: '#4a4e57',
  textMuted: '#7d818b',
  disabled: '#c4c7cc',
  error: '#dc2626',
  errorLight: '#fdecec',
  warning: '#c2410c',
  warningLight: '#fff4e5',
  success: '#15803d',
  successLight: '#e3f6e8',
  pending: '#c2410c',
  pendingLight: '#fff4e5',
  cancelled: '#dc2626',
  cancelledLight: '#fdecec',
  white: '#ffffff',
  /** Tip and info cards. */
  tip: '#eef2fd',
  tipBorder: '#d6def6',
  overlay: 'rgba(10,10,10,0.45)',
  /** Calendar: hours outside the working day, and the current-time line. */
  offHours: '#f3f4f6',
  nowLine: '#e11d48',
  // Older names still used by a few screens.
  ink: '#0b1638',
  mist: '#eef1f6',
  sky: '#f1f5fe',
  field: '#f5f6f8',
  fieldBorder: '#e4e6eb',
  mintSoft: '#e3f6e8',
  amberSoft: '#fff4e5',
  onDark: '#ffffff',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  onDarkFaint: 'rgba(255,255,255,0.14)',
  onDarkLine: 'rgba(255,255,255,0.22)',
};

export type Colors = typeof light;

const dark: Colors = {
  primary: '#3f5fd9',
  onPrimary: '#ffffff',
  accent: '#3f5fd9',
  onAccent: '#ffffff',
  link: '#8fa6ff',
  accentLight: '#18204a',
  background: '#0d0d0d',
  surface: '#1a1a1a',
  card: '#0d0d0d',
  border: '#2b2b2b',
  borderStrong: '#3f3f3f',
  text: '#ffffff',
  textSecondary: '#b5b5b5',
  textMuted: '#858585',
  disabled: '#4a4a4a',
  error: '#f87171',
  errorLight: '#3a1515',
  warning: '#f59e0b',
  warningLight: '#33240b',
  success: '#6fcf5a',
  successLight: '#16301a',
  pending: '#f59e0b',
  pendingLight: '#33240b',
  cancelled: '#f87171',
  cancelledLight: '#3a1515',
  white: '#ffffff',
  tip: '#161c3d',
  tipBorder: '#262e5e',
  overlay: 'rgba(0,0,0,0.6)',
  offHours: '#151515',
  nowLine: '#f43f5e',
  ink: '#e8eef9',
  mist: '#161a26',
  sky: '#121726',
  field: '#1a1a1a',
  fieldBorder: '#2e2e2e',
  mintSoft: '#16301a',
  amberSoft: '#33240b',
  onDark: '#ffffff',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  onDarkFaint: 'rgba(255,255,255,0.14)',
  onDarkLine: 'rgba(255,255,255,0.22)',
};

export const palettes = { light, dark };

export type Scheme = 'light' | 'dark';
/** What the person picked in Settings → Appearance. */
export type ThemeMode = 'system' | Scheme;

const MODE_KEY = 'vendor_theme_mode';

interface ThemeValue {
  scheme: Scheme;
  mode: ThemeMode;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue>({
  scheme: 'light',
  mode: 'system',
  colors: light,
  setMode: () => {},
});

/** Follows the phone's light/dark setting unless the person chose one in Settings. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
    return {
      scheme,
      mode,
      colors: palettes[scheme],
      setMode: (next) => {
        setModeState(next);
        AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
      },
    };
  }, [mode, system]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

/**
 * Styles that depend on the palette. Built once per scheme and reused:
 *   const useStyles = makeStyles((colors) => ({ root: { backgroundColor: colors.background } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Colors) => T) {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles(): T {
    const { scheme, colors } = useTheme();
    return (cache[scheme] ??= StyleSheet.create(factory(colors)));
  };
}

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

/** Page gutter used by every screen. */
export const GUTTER = 24;

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
    md: 14,
    lg: 15,
    title: 17,
    xl: 22,
  },
} as const;
