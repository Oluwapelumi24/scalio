// Rule-based home suggestions from the business's own records (Phase 5).
// Each rule stays quiet until there's enough data to be worth saying.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Bookings needed over the look-back window before a quiet day means anything. */
export const QUIET_DAY_MIN_BOOKINGS = 20;
/** A day counts as quiet below this share of the average open day. */
export const QUIET_DAY_SHARE = 0.6;

/**
 * The open day of the week with clearly fewer bookings than the rest.
 * @param counts bookings per weekday, 0 = Sunday … 6 = Saturday
 * @param openDays weekdays the business opens (from its hours); null = every day
 */
export function quietestDay(counts: number[], openDays: Set<number> | null) {
  const days = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays || openDays.has(d));
  if (days.length < 2) return null;
  const total = days.reduce((a, d) => a + (counts[d] ?? 0), 0);
  if (total < QUIET_DAY_MIN_BOOKINGS) return null;
  const average = total / days.length;
  const quietest = days.reduce((min, d) => ((counts[d] ?? 0) < (counts[min] ?? 0) ? d : min), days[0]);
  if ((counts[quietest] ?? 0) >= average * QUIET_DAY_SHARE) return null;
  return { weekday: quietest, day: DAY_NAMES[quietest], bookings: counts[quietest] ?? 0, averageBookings: Math.round(average * 10) / 10 };
}

export const NO_SHOW_MIN_BOOKINGS = 10;
export const NO_SHOW_ALERT_RATE = 0.1;

/** Worth suggesting deposits when no-shows are common and some services take no payment upfront. */
export function noShowAdvice(completed: number, noShows: number, payOnArrivalServices: number) {
  const seen = completed + noShows;
  if (seen < NO_SHOW_MIN_BOOKINGS || payOnArrivalServices === 0) return null;
  const rate = noShows / seen;
  return rate >= NO_SHOW_ALERT_RATE ? { noShows, rate: Math.round(rate * 1000) / 1000 } : null;
}
