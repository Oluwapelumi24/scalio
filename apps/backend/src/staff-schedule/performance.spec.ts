import { computePerformance, scheduledMinutes, type PerfBooking, type PerfRange } from './performance';

const now = new Date('2026-10-15T12:00:00Z');
// Thu 1 Oct – Wed 14 Oct 2026, all in the past relative to `now`.
const range: PerfRange = {
  fromDate: '2026-10-01',
  toDate: '2026-10-14',
  start: new Date('2026-09-30T23:00:00Z'),
  end: new Date('2026-10-14T23:00:00Z'),
  today: '2026-10-15',
};
const staff = [
  { id: 'ada', name: 'Ada', role: 'practitioner' },
  { id: 'bayo', name: 'Bayo', role: 'practitioner' },
];
const at = (day: number) => new Date(Date.UTC(2026, 9, day, 10));
const booking = (over: Partial<PerfBooking>): PerfBooking => ({
  staffId: 'ada',
  customerId: 'c1',
  status: 'completed',
  scheduledAt: at(2),
  totalPriceKobo: 1_000_000,
  ...over,
});
const base = { staff, shifts: [], patterns: new Map(), timeOff: [], range, attendanceSince: null as string | null, now };

describe('computePerformance', () => {
  const bookings: PerfBooking[] = [
    booking({}),
    booking({ scheduledAt: at(9) }), // c1 again → repeat customer
    booking({ customerId: 'c2', totalPriceKobo: 500_000 }),
    booking({ customerId: 'c3', status: 'no_show' }),
    booking({ customerId: 'c4', status: 'cancelled_by_customer' }), // not held against Ada
    booking({ staffId: 'bayo', customerId: 'c5', status: 'cancelled_by_vendor' }),
    booking({ staffId: null, customerId: 'c6' }),
  ];
  const [ada, bayo, unassigned] = computePerformance({ ...base, bookings });

  it('counts sales from completed bookings only', () => {
    expect(ada.completed).toBe(3);
    expect(ada.salesKobo).toBe(2_500_000);
    expect(ada.averageSaleKobo).toBe(833_333);
  });

  it('leaves customer cancellations out of the completion rate', () => {
    // 3 completed ÷ (3 completed + 1 no-show)
    expect(ada.completionRate).toBeCloseTo(0.75);
    expect(ada.cancelledByCustomer).toBe(1);
  });

  it('counts a business cancellation against the completion rate', () => {
    expect(bayo.completionRate).toBe(0);
  });

  it('counts customers with two or more completed visits as repeat customers', () => {
    expect(ada.uniqueCustomers).toBe(2);
    expect(ada.repeatCustomers).toBe(1);
  });

  it('puts unassigned bookings on their own row so totals add up', () => {
    expect(unassigned).toMatchObject({ staffId: null, name: 'Not assigned', completed: 1 });
  });

  it('has no completion rate when nothing has happened yet', () => {
    const [fresh] = computePerformance({ ...base, staff: [staff[0]], bookings: [booking({ status: 'confirmed', scheduledAt: new Date('2026-10-20T10:00:00Z') })] });
    expect(fresh.completionRate).toBeNull();
    expect(fresh.upcoming).toBe(1);
  });

  it('hides attendance entirely when the business does not clock in', () => {
    expect(ada.attendance).toBeNull();
  });
});

describe('attendance', () => {
  // Ada works Mon–Fri 9:00–17:00 with a 1-hour lunch → 7h a day.
  const weekdays = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
    dayOfWeek,
    startsAtMinutes: 540,
    endsAtMinutes: 1020,
    breakStartsAtMinutes: 780,
    breakEndsAtMinutes: 840,
  }));

  it('schedules 7h a weekday and skips weekends and leave', () => {
    // 1–14 Oct 2026 has 10 weekdays; one day of leave on Mon 5 Oct.
    expect(scheduledMinutes(weekdays, [], '2026-10-01', '2026-10-14')).toBe(10 * 420);
    expect(scheduledMinutes(weekdays, [{ staffId: 'ada', startDate: '2026-10-05', endDate: '2026-10-05' }], '2026-10-01', '2026-10-14')).toBe(9 * 420);
  });

  it('compares clocked hours with scheduled hours', () => {
    const shifts = [
      { staffId: 'ada', clockInAt: new Date('2026-10-01T08:00:00Z'), clockOutAt: new Date('2026-10-01T16:00:00Z') }, // 8h
      { staffId: 'ada', clockInAt: new Date('2026-10-02T08:00:00Z'), clockOutAt: new Date('2026-10-02T14:00:00Z') }, // 6h
    ];
    const [ada, bayo] = computePerformance({
      ...base,
      bookings: [],
      shifts,
      patterns: new Map([['ada', weekdays]]),
      attendanceSince: '2026-09-01',
    });
    expect(ada.attendance).toEqual({ workedMinutes: 14 * 60, scheduledMinutes: 10 * 420, rate: (14 * 60) / (10 * 420), clockedInNow: false });
    // Bayo has no weekly pattern: hours worked, but no rate to compare against.
    expect(bayo.attendance).toEqual({ workedMinutes: 0, scheduledMinutes: null, rate: null, clockedInNow: false });
  });

  it('only counts scheduled hours from the day the business started clocking in', () => {
    const [ada] = computePerformance({
      ...base,
      staff: [staff[0]],
      bookings: [],
      patterns: new Map([['ada', weekdays]]),
      attendanceSince: '2026-10-12', // Mon 12 – Wed 14 Oct: 3 weekdays
    });
    expect(ada.attendance?.scheduledMinutes).toBe(3 * 420);
  });

  it('counts an open shift up to now and flags it', () => {
    const [ada] = computePerformance({
      ...base,
      staff: [staff[0]],
      bookings: [],
      range: { ...range, toDate: '2026-10-15', end: new Date('2026-10-15T23:00:00Z') },
      shifts: [{ staffId: 'ada', clockInAt: new Date('2026-10-15T10:00:00Z'), clockOutAt: null }],
      attendanceSince: '2026-10-15',
    });
    expect(ada.attendance).toMatchObject({ workedMinutes: 120, clockedInNow: true });
  });
});
