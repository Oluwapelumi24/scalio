import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vendor_jwt';

export interface VendorSession {
  staffId: string;
  vendorId: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

let _session: VendorSession | null = null;
let migrated = false;

async function migrateIfNeeded(): Promise<void> {
  if (migrated) return;
  migrated = true;
  try {
    const legacy = await AsyncStorage.getItem(TOKEN_KEY);
    if (!legacy) return;
    const existing = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!existing) await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // leave legacy key if SecureStore is unavailable
  }
}

export async function saveSession(session: VendorSession): Promise<void> {
  _session = session;
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(session));
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** True when the JWT's `exp` has passed (or can't be read). Sign-ins last 7 days. */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function loadSession(): Promise<VendorSession | null> {
  if (_session) return _session;
  await migrateIfNeeded();
  try {
    const raw =
      (await SecureStore.getItemAsync(TOKEN_KEY)) ?? (await AsyncStorage.getItem(TOKEN_KEY));
    if (!raw) return null;
    const session = JSON.parse(raw) as VendorSession;
    if (isExpired(session.token)) {
      await clearSession();
      return null;
    }
    _session = session;
    await SecureStore.setItemAsync(TOKEN_KEY, raw);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return _session;
  } catch {
    return null;
  }
}

export function getSession(): VendorSession | null {
  return _session;
}

export async function clearSession(): Promise<void> {
  _session = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// The navigator listens for this so a rejected token sends the user back to sign in.
let _onExpired: (() => void) | null = null;

export function onSessionExpired(listener: () => void): () => void {
  _onExpired = listener;
  return () => {
    if (_onExpired === listener) _onExpired = null;
  };
}

export async function expireSession(): Promise<void> {
  if (!_session) return;
  await clearSession();
  _onExpired?.();
}
