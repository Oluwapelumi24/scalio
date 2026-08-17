import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from './api';
import { getMe } from './api';

const TOKEN_KEY = 'scalio:accessToken';
const USER_KEY = 'scalio:user';

// In-memory mirror of what's on disk so `getCurrentUser()` can stay a cheap
// synchronous call for the many screens that read it during render.
let currentUser: AppUser | null = null;
let currentToken: string | null = null;

export async function setSession(accessToken: string, user: AppUser): Promise<void> {
  currentToken = accessToken;
  currentUser = user;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export function getCurrentUser(): AppUser | null {
  return currentUser;
}

export function getAccessToken(): string | null {
  return currentToken;
}

export async function signOut(): Promise<void> {
  currentUser = null;
  currentToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

/**
 * Loads any persisted session into memory and confirms it's still valid with
 * the backend. Call once at app launch before rendering the navigator — a
 * dead/expired token is cleared rather than left to fail on first use.
 */
export async function restoreSession(): Promise<void> {
  const [[, token], [, rawUser]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token || !rawUser) return;

  try {
    const user = await getMe(token);
    currentToken = token;
    currentUser = user;
  } catch {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
}
