import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getHome, type HomeResponse } from './api';

export type SetupState = HomeResponse['bookings'] & {
  /** Customers can book once there's a service and opening hours. */
  ready: boolean;
};

let last: SetupState | null = null;

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
