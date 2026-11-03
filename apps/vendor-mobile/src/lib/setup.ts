import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getHome, type HomeResponse } from './api';

export type SetupState = HomeResponse['bookings'] & {
  /** Customers can book once there's a service and opening hours. */
  ready: boolean;
};

let last: SetupState | null = null;

/** The steps on the Setup screen, in the same order, as short names. */
const STEPS: { name: string; done: (s: SetupState) => boolean }[] = [
  { name: 'Add your services', done: (s) => s.setup.services },
  { name: 'Set opening hours', done: (s) => s.setup.hours },
  { name: 'Take payments online', done: (s) => s.setup.payments },
  { name: 'Share your booking link', done: (s) => s.total > 0 },
];

/** How far through setup the business is, for the "Continue setup" bar. */
export function setupProgress(s: SetupState): { done: number; total: number; left: number; next: string | null } {
  const done = STEPS.filter((step) => step.done(s)).length;
  return {
    done,
    total: STEPS.length,
    left: STEPS.length - done,
    next: STEPS.find((step) => !step.done(s))?.name ?? null,
  };
}

function toState(b: HomeResponse['bookings']): SetupState {
  return { ...b, ready: b.setup.services && b.setup.hours };
}

/**
 * What still stops this business taking bookings, plus its booking link.
 * Refreshes whenever the screen comes into focus; the last answer is shared
 * so the "Continue setup" bar doesn't flicker between screens.
 */
export function useSetupStatus(): SetupState | null {
  const [state, setState] = useState<SetupState | null>(last);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      getHome()
        .then((h) => {
          if (!h.bookings) return;
          last = toState(h.bookings);
          if (live) setState(last);
        })
        .catch(() => {});
      return () => { live = false; };
    }, []),
  );
  return state;
}
