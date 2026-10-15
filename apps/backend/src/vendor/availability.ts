// Slot generation is intentionally simple for now: a fixed granularity and a
// fallback business-hours window for vendors that haven't configured their
// own (see `business_hours`/`blackout_dates` — `VendorService.getAvailability`
// looks those up and falls back to these constants when nothing's set).
// Per-staff schedules are applied via `staffWorkingWindow`; service buffer
// time (PRD §4.1 step 6) is still TODO.
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

/** One day of a staff member's weekly pattern (see `staff_working_hours`). */
export interface StaffDay {
  startsAtMinutes: number;
  endsAtMinutes: number;
  breakStartsAtMinutes: number | null;
  breakEndsAtMinutes: number | null;
}

export interface StaffDayContext {
  /** False when the staff member has no weekly pattern at all — they work whenever the business is open. */
  hasSchedule: boolean;
  /** Their pattern for the requested weekday, if they work that day. */
  day: StaffDay | undefined;
  onTimeOff: boolean;
}

/**
 * When a specific staff member can take bookings on one day: the overlap of
 * the business's hours and their own, with their break blocked out. `null`
 * means they aren't working (on leave, or a day off in their pattern).
 */
export function staffWorkingWindow(
  businessHours: OpenHours,
  ctx: StaffDayContext,
): { hours: OpenHours; breaks: BusyInterval[] } | null {
  if (ctx.onTimeOff) return null;
  if (!ctx.hasSchedule) return { hours: businessHours, breaks: [] };
  if (!ctx.day) return null;

  const hours = {
    startMinutes: Math.max(businessHours.startMinutes, ctx.day.startsAtMinutes),
    endMinutes: Math.min(businessHours.endMinutes, ctx.day.endsAtMinutes),
  };
  if (hours.startMinutes >= hours.endMinutes) return null;

  const { breakStartsAtMinutes: bs, breakEndsAtMinutes: be } = ctx.day;
  const breaks = bs != null && be != null && be > bs ? [{ startMinutes: bs, endMinutes: be }] : [];
  return { hours, breaks };
}

/** True if a booking from `startMinutes` lasting `durationMinutes` fits inside the window. */
export function fitsWorkingWindow(
  window: { hours: OpenHours; breaks: BusyInterval[] },
  startMinutes: number,
  durationMinutes: number,
): boolean {
  const end = startMinutes + durationMinutes;
  if (startMinutes < window.hours.startMinutes || end > window.hours.endMinutes) return false;
  return !window.breaks.some((b) => startMinutes < b.endMinutes && end > b.startMinutes);
}

/** 'YYYY-MM-DD' for a Date in the same timezone-naive local sense as `dateFromOffset`. */
export function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { DEFAULT_OPEN_HOURS };
