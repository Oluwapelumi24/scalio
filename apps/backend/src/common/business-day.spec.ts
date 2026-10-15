import { businessDayBounds } from './business-day';

describe('businessDayBounds', () => {
  it('uses the business timezone, not UTC (Lagos is UTC+1)', () => {
    // 23:30 UTC on the 14th is already 00:30 on the 15th in Lagos.
    const { start, end } = businessDayBounds(new Date('2026-10-14T23:30:00Z'), 'Africa/Lagos');
    expect(start.toISOString()).toBe('2026-10-14T23:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-15T23:00:00.000Z');
  });

  it('handles a zone behind UTC across a DST change', () => {
    // New York leaves DST on 2026-11-01: that day is 25 hours long.
    const { start, end } = businessDayBounds(new Date('2026-11-01T15:00:00Z'), 'America/New_York');
    expect(start.toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-02T05:00:00.000Z');
  });
});
