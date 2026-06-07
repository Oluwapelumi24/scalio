import { computeAvailableSlotOffsets, BUSINESS_HOURS_START_MINUTES, BUSINESS_HOURS_END_MINUTES } from './availability';

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
