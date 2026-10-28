import type { StaffDay } from '../vendor/availability';

/**
 * Plain-language definitions shown next to every metric, so owners know
 * exactly what a number means before comparing people with it.
 */
export const METRIC_DEFINITIONS = {
  sales: 'Value of completed bookings, at the prices when they were booked.',
  completed: 'Bookings marked completed.',
  completionRate:
    'Completed ÷ (completed + no-shows + cancelled by the business), for bookings that have already happened. Customer cancellations are left out.',
  uniqueCustomers: 'Different customers with at least one completed booking.',
  repeatCustomers: 'Customers with two or more completed bookings with this person in the period.',
  attendance:
    'Hours clocked in ÷ hours scheduled, from each person’s weekly pattern minus breaks and time off — counted from the day the business started clocking in, up to today. Only shown when the business records clock-ins and the person has a weekly pattern.',
  feedback: 'Average of the 1–5 star ratings customers gave after completed bookings in the period, and how many rated. Scalio asks every customer with an email; the business can also send the link on WhatsApp.',
} as const;

export interface PerfStaff {
  id: string;
  name: string;
  role: string;
}

export interface PerfBooking {
  staffId: string | null;
  customerId: string;
  status: string;
  scheduledAt: Date;
  totalPriceKobo: number;
}

export interface PerfShift {
  staffId: string;
  clockInAt: Date;
  clockOutAt: Date | null;
}

export interface PerfTimeOff {
  staffId: string;
  startDate: string;
  endDate: string;
}

export interface PerfRange {
  /** Inclusive business-calendar dates, 'YYYY-MM-DD'. */
  fromDate: string;
  toDate: string;
  start: Date;
  end: Date;
  /** Today in the business's calendar — scheduled hours aren't counted beyond it. */
  today: string;
}

export interface StaffPerformance {
  staffId: string | null;
  name: string;
  role: string | null;
  bookings: number;
  completed: number;
  noShows: number;
  cancelledByBusiness: number;
  cancelledByCustomer: number;
  upcoming: number;
  salesKobo: number;
  averageSaleKobo: number | null;
  completionRate: number | null;
  uniqueCustomers: number;
  repeatCustomers: number;
  attendance: {
    workedMinutes: number;
    scheduledMinutes: number | null;
    rate: number | null;
    clockedInNow: boolean;
  } | null;
}

function* datesBetween(from: string, to: string): Generator<string> {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  for (let t = Date.UTC(fy, fm - 1, fd); t <= Date.UTC(ty, tm - 1, td); t += 86_400_000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}

function weekday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function shiftMinutes(day: StaffDay): number {
  const length = day.endsAtMinutes - day.startsAtMinutes;
  const { breakStartsAtMinutes: bs, breakEndsAtMinutes: be } = day;
  return Math.max(0, length - (bs != null && be != null && be > bs ? be - bs : 0));
}

/** Scheduled working minutes from `from` to `to` (inclusive), skipping time off. */
export function scheduledMinutes(
  pattern: (StaffDay & { dayOfWeek: number })[],
  timeOff: PerfTimeOff[],
  from: string,
  to: string,
): number {
  let total = 0;
  for (const date of datesBetween(from, to)) {
    if (timeOff.some((t) => t.startDate <= date && date <= t.endDate)) continue;
    const day = pattern.find((p) => p.dayOfWeek === weekday(date));
    if (day) total += shiftMinutes(day);
  }
  return total;
}

function stats(name: string, staffId: string | null, role: string | null, rows: PerfBooking[], now: Date) {
  const done = rows.filter((b) => b.status === 'completed');
  const past = rows.filter((b) => b.scheduledAt <= now);
  const noShows = past.filter((b) => b.status === 'no_show').length;
  const cancelledByBusiness = past.filter((b) => b.status === 'cancelled_by_vendor').length;
  const denominator = done.length + noShows + cancelledByBusiness;
  const salesKobo = done.reduce((sum, b) => sum + b.totalPriceKobo, 0);

  const visits = new Map<string, number>();
  for (const b of done) visits.set(b.customerId, (visits.get(b.customerId) ?? 0) + 1);

  return {
    staffId,
    name,
    role,
    bookings: rows.length,
    completed: done.length,
    noShows: rows.filter((b) => b.status === 'no_show').length,
    cancelledByBusiness: rows.filter((b) => b.status === 'cancelled_by_vendor').length,
    cancelledByCustomer: rows.filter((b) => b.status === 'cancelled_by_customer').length,
    upcoming: rows.filter((b) => (b.status === 'confirmed' || b.status === 'pending_payment') && b.scheduledAt > now).length,
    salesKobo,
    averageSaleKobo: done.length ? Math.round(salesKobo / done.length) : null,
    completionRate: denominator ? done.length / denominator : null,
    uniqueCustomers: visits.size,
    repeatCustomers: [...visits.values()].filter((n) => n >= 2).length,
  };
}

/**
 * Per-person performance for one period. Pure, so every definition above is
 * pinned down by tests. Bookings with nobody assigned get their own row, so the
 * figures always add up to the business total.
 */
export function computePerformance(input: {
  staff: PerfStaff[];
  bookings: PerfBooking[];
  shifts: PerfShift[];
  patterns: Map<string, (StaffDay & { dayOfWeek: number })[]>;
  timeOff: PerfTimeOff[];
  range: PerfRange;
  /**
   * Business date of the first clock-in ever recorded, or null if the business
   * doesn't clock in — attendance is then not shown at all. Scheduled hours
   * before this date aren't counted: nobody could have clocked in for them.
   */
  attendanceSince: string | null;
  now: Date;
}): StaffPerformance[] {
  const { range, now } = input;
  const scheduleUntil = range.toDate < range.today ? range.toDate : range.today;
  const since = input.attendanceSince;
  const scheduleFrom = since && since > range.fromDate ? since : range.fromDate;

  const rows: StaffPerformance[] = input.staff.map((member) => {
    const own = input.bookings.filter((b) => b.staffId === member.id);
    let attendance: StaffPerformance['attendance'] = null;

    if (since) {
      const shifts = input.shifts.filter((s) => s.staffId === member.id);
      const workedMinutes = Math.round(
        shifts.reduce((sum, s) => {
          const from = Math.max(s.clockInAt.getTime(), range.start.getTime());
          const to = Math.min((s.clockOutAt ?? now).getTime(), range.end.getTime(), now.getTime());
          return sum + Math.max(0, to - from) / 60_000;
        }, 0),
      );
      const pattern = input.patterns.get(member.id) ?? [];
      const scheduled =
        pattern.length > 0 && scheduleFrom <= scheduleUntil
          ? scheduledMinutes(pattern, input.timeOff.filter((t) => t.staffId === member.id), scheduleFrom, scheduleUntil)
          : null;
      attendance = {
        workedMinutes,
        scheduledMinutes: scheduled,
        rate: scheduled ? workedMinutes / scheduled : null,
        clockedInNow: shifts.some((s) => s.clockOutAt === null),
      };
    }

    return { ...stats(member.name, member.id, member.role, own, now), attendance };
  });

  const unassigned = input.bookings.filter((b) => b.staffId === null || !input.staff.some((m) => m.id === b.staffId));
  if (unassigned.length > 0) rows.push({ ...stats('Not assigned', null, null, unassigned, now), attendance: null });

  return rows;
}
