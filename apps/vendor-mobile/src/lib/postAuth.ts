import { getPreferences } from './api';

/**
 * Where a freshly signed-in user should land. Owners and managers who haven't
 * told us what they want help with see the interest screen first; everyone else
 * (and anyone if the check fails) goes straight to the app — it's never a gate.
 */
export async function routeAfterSignIn(role: string): Promise<'InterestSelection' | 'Main'> {
  if (role !== 'owner' && role !== 'manager') return 'Main';
  try {
    const prefs = await getPreferences();
    return prefs.interestsCompletedAt ? 'Main' : 'InterestSelection';
  } catch {
    return 'Main';
  }
}
