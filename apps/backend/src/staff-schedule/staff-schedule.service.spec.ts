import { ForbiddenException } from '@nestjs/common';
import { resolveTargetStaff } from './access';
import { resolvePeriod } from './period';
import { scheduleProblem } from './staff-schedule.service';

const day = { dayOfWeek: 1, startsAtMinutes: 540, endsAtMinutes: 1020 };

describe('scheduleProblem', () => {
  it('accepts a normal week with and without breaks', () => {
    expect(scheduleProblem([day, { ...day, dayOfWeek: 2, breakStartsAtMinutes: 780, breakEndsAtMinutes: 840 }])).toBeNull();
    expect(scheduleProblem([])).toBeNull();
  });

  it.each([
    [[day, day], 'Each day can only appear once.'],
    [[{ ...day, endsAtMinutes: 540 }], 'A shift must end after it starts.'],
    [[{ ...day, breakStartsAtMinutes: 780 }], 'A break needs both a start and an end time.'],
    [[{ ...day, breakStartsAtMinutes: 840, breakEndsAtMinutes: 780 }], 'A break must end after it starts.'],
    [[{ ...day, breakStartsAtMinutes: 500, breakEndsAtMinutes: 560 }], 'A break must fall inside the shift.'],
  ])('rejects %j', (days, message) => {
    expect(scheduleProblem(days)).toBe(message);
  });
});

describe('resolveTargetStaff', () => {
  const owner = { staffId: 'o', vendorId: 'v', name: 'O', email: null, role: 'owner' };
  const practitioner = { ...owner, staffId: 'p', role: 'practitioner' };

  it('defaults to yourself', () => {
    expect(resolveTargetStaff(practitioner)).toBe('p');
  });
  it('lets owners and managers act for others', () => {
    expect(resolveTargetStaff(owner, 'p')).toBe('p');
  });
  it('stops everyone else acting for others', () => {
    expect(() => resolveTargetStaff(practitioner, 'o')).toThrow(ForbiddenException);
  });
});

describe('resolvePeriod', () => {
  it('turns inclusive Lagos dates into UTC instants', () => {
    const r = resolvePeriod('2026-10-01', '2026-10-14', 'Africa/Lagos', new Date('2026-10-15T09:00:00Z'));
    expect(r.start.toISOString()).toBe('2026-09-30T23:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-10-14T23:00:00.000Z');
    expect(r.today).toBe('2026-10-15');
  });
  it('rejects backwards or over-long periods', () => {
    expect(() => resolvePeriod('2026-10-14', '2026-10-01', 'Africa/Lagos', new Date())).toThrow();
    expect(() => resolvePeriod('2025-01-01', '2026-10-01', 'Africa/Lagos', new Date())).toThrow();
  });
});
