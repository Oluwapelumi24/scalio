// Slot generation is intentionally simple for now: a fixed business-hours
// window and a fixed granularity. Vendor-configurable hours, per-staff
// schedules, and service buffer time (PRD §4.1 step 6) aren't modeled yet —
// this is the seam to extend when they are.
export const BUSINESS_HOURS_START_MINUTES = 9 * 60; // 09:00
export const BUSINESS_HOURS_END_MINUTES = 18 * 60; // 18:00
export const SLOT_GRANULARITY_MINUTES = 30;

export interface BusyInterval {
  startMinutes: number;
  endMinutes: number;
}

/**
 * Returns minute-of-day offsets (from local midnight of the requested date)
 * where a service of `durationMinutes` could start without overlapping any
 * busy interval or running past closing time.
 */
export function computeAvailableSlotOffsets(
  durationMinutes: number,
  busyIntervals: BusyInterval[],
): number[] {
  const offsets: number[] = [];

  for (
    let start = BUSINESS_HOURS_START_MINUTES;
    start + durationMinutes <= BUSINESS_HOURS_END_MINUTES;
    start += SLOT_GRANULARITY_MINUTES
  ) {
    const end = start + durationMinutes;
    const overlaps = busyIntervals.some((busy) => start < busy.endMinutes && end > busy.startMinutes);
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
