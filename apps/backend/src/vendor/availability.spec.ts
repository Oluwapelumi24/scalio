import { computeAvailableSlotOffsets, BUSINESS_HOURS_START_MINUTES, BUSINESS_HOURS_END_MINUTES, fitsWorkingWindow, staffWorkingWindow } from './availability';

describe('computeAvailableSlotOffsets', () => {
  it('returns every granularity-aligned start when there are no bookings', () => {
    const offsets = computeAvailableSlotOffsets(60, []);

    expect(offsets[0]).toBe(BUSINESS_HOURS_START_MINUTES);
    expect(offsets[offsets.length - 1] + 60).toBeLessThanOrEqual(BUSINESS_HOURS_END_MINUTES);
    // 9:00-18:00 minus a 60-min service, every 30 min => offsets up to 17:00
    expect(offsets[offsets.length - 1]).toBe(17 * 60);
  });

  it('excludes any candidate slot that overlaps a busy interval', () => {
    // Busy 10:00-11:00. A 60-min service starting at 9:30 would end at 10:30 (overlap) — excluded.
    // One starting at 11:00 doesn't overlap — included.
    const offsets = computeAvailableSlotOffsets(60, [{ startMinutes: 10 * 60, endMinutes: 11 * 60 }]);

    expect(offsets).not.toContain(9 * 60 + 30);
    expect(offsets).not.toContain(10 * 60);
    expect(offsets).toContain(11 * 60);
  });

  it('excludes slots that would run past closing time', () => {
    const offsets = computeAvailableSlotOffsets(180, []); // 3-hour service

    for (const offset of offsets) {
      expect(offset + 180).toBeLessThanOrEqual(BUSINESS_HOURS_END_MINUTES);
    }
    expect(offsets).toContain(15 * 60); // 15:00-18:00 fits exactly
    expect(offsets).not.toContain(15 * 60 + 30); // 15:30-18:30 would not
  });

  it('returns nothing when fully booked', () => {
    const offsets = computeAvailableSlotOffsets(30, [
      { startMinutes: BUSINESS_HOURS_START_MINUTES, endMinutes: BUSINESS_HOURS_END_MINUTES },
    ]);

    expect(offsets).toHaveLength(0);
  });
});

describe('staffWorkingWindow', () => {
  const business = { startMinutes: 9 * 60, endMinutes: 18 * 60 };
  const day = { startsAtMinutes: 10 * 60, endsAtMinutes: 20 * 60, breakStartsAtMinutes: 13 * 60, breakEndsAtMinutes: 14 * 60 };

  it('uses business hours for staff without a weekly pattern', () => {
    expect(staffWorkingWindow(business, { hasSchedule: false, day: undefined, onTimeOff: false })).toEqual({ hours: business, breaks: [] });
  });

  it('is closed on leave and on days off', () => {
    expect(staffWorkingWindow(business, { hasSchedule: false, day: undefined, onTimeOff: true })).toBeNull();
    expect(staffWorkingWindow(business, { hasSchedule: true, day: undefined, onTimeOff: false })).toBeNull();
  });

  it('overlaps the shift with business hours and blocks the break', () => {
    expect(staffWorkingWindow(business, { hasSchedule: true, day, onTimeOff: false })).toEqual({
      hours: { startMinutes: 10 * 60, endMinutes: 18 * 60 },
      breaks: [{ startMinutes: 13 * 60, endMinutes: 14 * 60 }],
    });
  });

  it('is closed when the shift falls entirely outside business hours', () => {
    const evening = { ...day, startsAtMinutes: 19 * 60, endsAtMinutes: 22 * 60 };
    expect(staffWorkingWindow(business, { hasSchedule: true, day: evening, onTimeOff: false })).toBeNull();
  });
});

describe('fitsWorkingWindow', () => {
  const window = { hours: { startMinutes: 600, endMinutes: 1080 }, breaks: [{ startMinutes: 780, endMinutes: 840 }] };
  it('accepts bookings inside the shift and rejects ones that cross the break or the edges', () => {
    expect(fitsWorkingWindow(window, 600, 60)).toBe(true);
    expect(fitsWorkingWindow(window, 750, 60)).toBe(false); // runs into the break
    expect(fitsWorkingWindow(window, 1050, 60)).toBe(false); // runs past the end
    expect(fitsWorkingWindow(window, 540, 30)).toBe(false); // before the start
  });
});
