import type { AppUser } from './api';

// In-memory placeholder until real session persistence (SecureStore + token
// refresh) lands — sufficient for the sign-up -> booking flow within one app run.
let currentUser: AppUser | null = null;

export function setCurrentUser(user: AppUser): void {
  currentUser = user;
}

export function getCurrentUser(): AppUser | null {
  return currentUser;
}

export function signOut(): void {
  currentUser = null;
}
