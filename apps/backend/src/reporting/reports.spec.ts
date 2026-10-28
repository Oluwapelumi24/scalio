import { acquisitionKey, bookingsReport, cashflowReport, customersReport, retentionReport, salesReport, splitByService } from './reports';

describe('splitByService', () => {
  it('splits by price and adds up exactly', () => {
    const prices = new Map([['a', 1_000_000], ['b', 500_000]]);
    const out = splitByService(1_400_000, ['a', 'b'], prices); // booked at a discount
    expect(out.get('a')! + out.get('b')!).toBe(1_400_000);
    expect(out.get('a')).toBe(933_333);
  });

  it('splits evenly when prices are unknown', () => {
    expect([...splitByService(300, ['x', 'y', 'z'], new Map()).values()]).toEqual([100, 100, 100]);
  });
});

describe('salesReport', () => {
  it('totals, averages and groups by service, staff and day with drill-down keys', () => {
    const r = salesReport(
      [
        { id: '1', totalPriceKobo: 1_000_000, serviceIds: ['cut'], staffId: 's1', date: '2026-10-01' },
        { id: '2', totalPriceKobo: 3_000_000, serviceIds: ['cut', 'dye'], staffId: null, date: '2026-10-01' },
      ],
      new Map([['cut', { name: 'Cut', priceKobo: 1_000_000 }], ['dye', { name: 'Dye', priceKobo: 2_000_000 }]]),
      new Map([['s1', 'Ada']]),
    );
    expect(r).toMatchObject({ salesKobo: 4_000_000, completed: 2, averageSaleKobo: 2_000_000 });
    expect(r.byService).toEqual([
      { key: 'service:cut', label: 'Cut', count: 2, amountKobo: 2_000_000 },
      { key: 'service:dye', label: 'Dye', count: 1, amountKobo: 2_000_000 },
    ]);
    expect(r.byStaff.map((g) => g.key)).toEqual(['staff:unassigned', 'staff:s1']);
    expect(r.byDay).toEqual([{ key: 'day:2026-10-01', label: '2026-10-01', count: 2, amountKobo: 4_000_000 }]);
  });
});

describe('bookingsReport', () => {
  it('works out cancellation and no-show rates, and busy days without cancellations', () => {
    const r = bookingsReport([
      { status: 'completed', weekday: 0 }, { status: 'completed', weekday: 0 }, { status: 'completed', weekday: 4 },
      { status: 'no_show', weekday: 4 }, { status: 'cancelled_by_customer', weekday: 0 },
    ]);
    expect(r.cancellationRate).toBe(0.2);
    expect(r.noShowRate).toBe(0.25);
    expect(r.byWeekday[0]).toEqual({ key: 'weekday:0', label: 'Monday', count: 2 });
  });

  it('has no rates without data rather than 0%', () => {
    expect(bookingsReport([])).toMatchObject({ cancellationRate: null, noShowRate: null });
  });
});

describe('cashflowReport', () => {
  it('nets money in and out and labels removed expenses', () => {
    const r = cashflowReport([
      { kind: 'booking_payment', direction: 'in', amountKobo: 500, date: '2026-10-01' },
      { kind: 'expense', direction: 'out', amountKobo: 200, date: '2026-10-01' },
      { kind: 'expense', direction: 'in', amountKobo: 50, date: '2026-10-02' },
    ]);
    expect(r).toMatchObject({ inKobo: 550, outKobo: 200, netKobo: 350 });
    expect(r.groups.find((g) => g.key === 'kind:expense:in')?.label).toBe('Expenses (removed)');
  });
});

describe('customers', () => {
  it('credits the lead source first, then online booking, then the business', () => {
    expect(acquisitionKey({ leadSource: 'instagram', userId: 'u1' })).toEqual({ key: 'source:lead_instagram', label: 'Lead: Instagram' });
    expect(acquisitionKey({ leadSource: null, userId: 'u1' }).key).toBe('source:online');
    expect(acquisitionKey({ leadSource: null, userId: null }).key).toBe('source:added');
    expect(customersReport([{ leadSource: null, userId: null, visitCount: 0 }, { leadSource: null, userId: 'u', visitCount: 2 }])).toMatchObject({ newCustomers: 2, visited: 1 });
  });

  it('splits customers served into returning and first visits', () => {
    const start = new Date('2026-10-01T00:00:00Z');
    const r = retentionReport({
      served: [{ customerId: 'a', firstCompletedAt: new Date('2026-08-01') }, { customerId: 'b', firstCompletedAt: new Date('2026-10-03') }],
      periodStart: start,
      allTime: [{ visitCount: 3 }, { visitCount: 1 }, { visitCount: 0 }],
      lapsed: 4,
    });
    expect(r).toMatchObject({ served: 2, returning: 1, firstVisits: 1, returningRate: 0.5, repeatRate: 0.5, lapsed: 4 });
  });
});
