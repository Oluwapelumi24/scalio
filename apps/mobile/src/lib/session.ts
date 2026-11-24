import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AppUser } from './api';
import { getMe } from './api';

const TOKEN_KEY = 'veno:accessToken';
const USER_KEY = 'veno:user';

// In-memory mirror of what's on disk so `getCurrentUser()` can stay a cheap
// synchronous call for the many screens that read it during render.
let currentUser: AppUser | null = null;
let currentToken: string | null = null;
let migrated = false;

/** One-time move of the JWT from AsyncStorage into SecureStore. */
async function migrateTokenIfNeeded(): Promise<void> {
  if (migrated) return;
  migrated = true;
  try {
    const legacy = await AsyncStorage.getItem(TOKEN_KEY);
    if (!legacy) return;
    const existing = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!existing) {
      await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // SecureStore can fail on some simulators; leave the legacy key alone.
  }
}

export async function setSession(accessToken: string, user: AppUser): Promise<void> {
  currentToken = accessToken;
  currentUser = user;
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await AsyncStorage.removeItem(TOKEN_KEY);
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
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

/**
 * Loads any persisted session into memory and confirms it's still valid with
 * the backend. Call once at app launch before rendering the navigator — a
 * dead/expired token is cleared rather than left to fail on first use.
 */
export async function restoreSession(): Promise<void> {
  await migrateTokenIfNeeded();
  const token = (await SecureStore.getItemAsync(TOKEN_KEY)) ?? (await AsyncStorage.getItem(TOKEN_KEY));
  const rawUser = await AsyncStorage.getItem(USER_KEY);
  if (!token || !rawUser) return;

  try {
    const user = await getMe(token);
    currentToken = token;
    currentUser = user;
    // Ensure the token lives in SecureStore after a successful restore.
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    await signOut();
  }
}
