import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveSession(session: VendorSession): Promise<void> {
  _session = session;
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(session));
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
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as VendorSession;
    if (isExpired(session.token)) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return null;
    }
    _session = session;
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
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// The navigator listens for this so a rejected token sends the user back to sign in.
let _onExpired: (() => void) | null = null;

export function onSessionExpired(listener: () => void): () => void {
  _onExpired = listener;
  return () => { if (_onExpired === listener) _onExpired = null; };
}

export async function expireSession(): Promise<void> {
  if (!_session) return;
  await clearSession();
  _onExpired?.();
}
