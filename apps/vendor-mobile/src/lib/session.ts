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

export async function loadSession(): Promise<VendorSession | null> {
  if (_session) return _session;
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    _session = JSON.parse(raw) as VendorSession;
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
