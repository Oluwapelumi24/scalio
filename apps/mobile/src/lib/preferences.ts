import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'scalio:hasSeenOnboarding';
const INTERESTS_KEY = 'scalio:interests';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
}

export async function setHasSeenOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function getInterests(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INTERESTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function setInterests(interests: string[]): Promise<void> {
  await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(interests));
}
