// Slot generation is intentionally simple for now: a fixed granularity and a
// fallback business-hours window for vendors that haven't configured their
// own (see `business_hours`/`blackout_dates` — `VendorService.getAvailability`
// looks those up and falls back to these constants when nothing's set).
// Per-staff schedules and service buffer time (PRD §4.1 step 6) are still TODO.
export const BUSINESS_HOURS_START_MINUTES = 9 * 60; // 09:00
export const BUSINESS_HOURS_END_MINUTES = 18 * 60; // 18:00
export const SLOT_GRANULARITY_MINUTES = 30;

export interface BusyInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface OpenHours {
  startMinutes: number;
  endMinutes: number;
}

const DEFAULT_OPEN_HOURS: OpenHours = {
  startMinutes: BUSINESS_HOURS_START_MINUTES,
  endMinutes: BUSINESS_HOURS_END_MINUTES,
};

/**
 * Returns minute-of-day offsets (from local midnight of the requested date)
 * where a service of `durationMinutes` could start without overlapping any
 * busy interval or running past closing time.
 */
export function computeAvailableSlotOffsets(
  durationMinutes: number,
  busyIntervals: BusyInterval[],
  hours: OpenHours = DEFAULT_OPEN_HOURS,
): number[] {
  const offsets: number[] = [];

  for (
    let start = hours.startMinutes;
    start + durationMinutes <= hours.endMinutes;
    start += SLOT_GRANULARITY_MINUTES
  ) {
    const end = start + durationMinutes;
    const overlaps = busyIntervals.some(
      (busy) => start < busy.endMinutes && end > busy.startMinutes,
    );
    if (!overlaps) {
      offsets.push(start);
    }
  }

  return offsets;
}

/** Builds a Date at the given date (YYYY-MM-DD) plus a minute-of-day offset, in the given timezone-naive local sense. */
export function dateFromOffset(isoDate: string, minuteOffset: number): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  date.setMinutes(minuteOffset);
  return date;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
