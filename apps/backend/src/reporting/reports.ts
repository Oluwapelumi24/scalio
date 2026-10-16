// Pure report builders. The service loads rows for one business and period;
// these turn them into summaries whose every group carries a `key` the apps
// pass back to list the exact records behind it.

export const REPORT_KINDS = ['sales', 'bookings', 'expenses', 'cashflow', 'customers', 'retention'] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_DEFINITIONS = {
  sales: 'Value of bookings completed in the period, at the prices when they were booked. A booking with several services is split between them by each service’s price.',
  averageSale: 'Sales ÷ completed bookings.',
  cancellationRate: 'Bookings cancelled (by the customer or the business) ÷ all bookings in the period.',
  noShowRate: 'No-shows ÷ (completed + no-shows): how often a booked customer didn’t turn up.',
  busiestDays: 'Bookings that went ahead or are still coming (not cancelled), by day of the week.',
  expenses: 'Expenses recorded for the period, by category. Removed expenses are left out.',
  cashflow: 'Money recorded in and out of your bank: online booking payments in; salaries and expenses out. Pay-on-arrival cash is only counted under Sales.',
  newCustomers: 'Customer records created in the period, by how they came to you: from a lead (and the lead’s source), booked online, or added by the business.',
  returning: 'Customers with a completed booking in the period who had also completed one before it.',
  firstVisits: 'Customers whose first completed booking was in the period.',
  repeatRate: 'Customers with two or more completed visits ÷ customers with at least one — all time.',
  lapsed: 'Customers whose last visit is longer ago than your usual gap between visits (45 days if not set).',
} as const;

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface Group { key: string; label: string; count: number; amountKobo?: number }

const rate = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 1000 : null);
const byAmount = (a: Group, b: Group) => (b.amountKobo ?? 0) - (a.amountKobo ?? 0) || b.count - a.count;

function bump(map: Map<string, Group>, key: string, label: string, amountKobo?: number) {
  const g = map.get(key) ?? { key, label, count: 0, ...(amountKobo !== undefined ? { amountKobo: 0 } : {}) };
  g.count += 1;
  if (amountKobo !== undefined) g.amountKobo = (g.amountKobo ?? 0) + amountKobo;
  map.set(key, g);
}

// ── Sales ────────────────────────────────────────────────────────────────────

export interface SalesBooking {
  id: string;
  totalPriceKobo: number;
  serviceIds: string[];
  staffId: string | null;
  /** Business-calendar date of the visit, 'YYYY-MM-DD'. */
  date: string;
}

/** Splits a booking's value between its services by each service's price (evenly if prices are unknown). */
export function splitByService(total: number, serviceIds: string[], prices: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  if (serviceIds.length === 0) return out;
  const weights = serviceIds.map((id) => prices.get(id) ?? 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  serviceIds.forEach((id, i) => {
    const share = i === serviceIds.length - 1
      ? total - allocated // the last one takes the rounding, so shares add up exactly
      : Math.round(sum > 0 ? (total * weights[i]) / sum : total / serviceIds.length);
    allocated += share;
    out.set(id, (out.get(id) ?? 0) + share);
  });
  return out;
}

export function salesReport(rows: SalesBooking[], services: Map<string, { name: string; priceKobo: number }>, staffNames: Map<string, string>) {
  const prices = new Map([...services].map(([id, s]) => [id, s.priceKobo]));
  const byService = new Map<string, Group>();
  const byStaff = new Map<string, Group>();
  const byDay = new Map<string, Group>();
  let total = 0;
  for (const b of rows) {
    total += b.totalPriceKobo;
    for (const [sid, amount] of splitByService(b.totalPriceKobo, b.serviceIds, prices)) {
      bump(byService, `service:${sid}`, services.get(sid)?.name ?? 'Removed service', amount);
    }
    const staffKey = b.staffId ?? 'unassigned';
    bump(byStaff, `staff:${staffKey}`, b.staffId ? staffNames.get(b.staffId) ?? 'Former staff' : 'Not assigned', b.totalPriceKobo);
    bump(byDay, `day:${b.date}`, b.date, b.totalPriceKobo);
  }
  return {
    salesKobo: total,
    completed: rows.length,
    averageSaleKobo: rows.length ? Math.round(total / rows.length) : null,
    byService: [...byService.values()].sort(byAmount),
    byStaff: [...byStaff.values()].sort(byAmount),
    byDay: [...byDay.values()].sort((a, b) => a.label.localeCompare(b.label)),
  };
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export interface BookingRow { status: string; /** 0 = Monday … 6 = Sunday, in the business's calendar. */ weekday: number }

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed', confirmed: 'Coming up', pending_payment: 'Waiting for payment',
  cancelled_by_customer: 'Cancelled by customer', cancelled_by_vendor: 'Cancelled by you', no_show: 'No-show',
};

export function bookingsReport(rows: BookingRow[]) {
  const byStatus = new Map<string, Group>();
  const byWeekday = new Map<string, Group>(WEEKDAYS.map((d, i) => [`weekday:${i}`, { key: `weekday:${i}`, label: d, count: 0 }]));
  for (const r of rows) {
    bump(byStatus, `status:${r.status}`, STATUS_LABELS[r.status] ?? r.status);
    if (!r.status.startsWith('cancelled')) byWeekday.get(`weekday:${r.weekday}`)!.count += 1;
  }
  const n = (s: string) => byStatus.get(`status:${s}`)?.count ?? 0;
  const cancelled = n('cancelled_by_customer') + n('cancelled_by_vendor');
  return {
    total: rows.length,
    cancellationRate: rate(cancelled, rows.length),
    noShowRate: rate(n('no_show'), n('completed') + n('no_show')),
    byStatus: [...byStatus.values()].sort((a, b) => b.count - a.count),
    byWeekday: [...byWeekday.values()],
  };
}

// ── Expenses and cash flow ───────────────────────────────────────────────────

export function expensesReport(rows: { category: string; amountKobo: number }[]) {
  const byCategory = new Map<string, Group>();
  for (const r of rows) bump(byCategory, `category:${r.category}`, r.category, r.amountKobo);
  return { totalKobo: rows.reduce((a, r) => a + r.amountKobo, 0), byCategory: [...byCategory.values()].sort(byAmount) };
}

const KIND_LABELS: Record<string, string> = { booking_payment: 'Online booking payments', salary: 'Salaries', expense: 'Expenses', adjustment: 'Adjustments' };

export function cashflowReport(rows: { kind: string; direction: 'in' | 'out'; amountKobo: number; date: string }[]) {
  const groups = new Map<string, Group>();
  const byDay = new Map<string, { date: string; inKobo: number; outKobo: number }>();
  let inKobo = 0;
  let outKobo = 0;
  for (const r of rows) {
    if (r.direction === 'in') inKobo += r.amountKobo; else outKobo += r.amountKobo;
    // A voided expense is recorded as money back in under 'expense'; netting keeps the label honest.
    bump(groups, `kind:${r.kind}:${r.direction}`, `${KIND_LABELS[r.kind] ?? r.kind}${r.direction === 'in' && r.kind === 'expense' ? ' (removed)' : ''}`, r.amountKobo);
    const d = byDay.get(r.date) ?? { date: r.date, inKobo: 0, outKobo: 0 };
    if (r.direction === 'in') d.inKobo += r.amountKobo; else d.outKobo += r.amountKobo;
    byDay.set(r.date, d);
  }
  return {
    inKobo, outKobo, netKobo: inKobo - outKobo,
    groups: [...groups.values()].sort(byAmount),
    byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// ── Customers ────────────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', whatsapp: 'WhatsApp', booking_page: 'Booking page',
  referral: 'Referral', walk_in: 'Walk-in', other: 'Other',
};

/** `leadSource` wins (the business knows where they came from); then booked online; else added by the business. */
export function acquisitionKey(c: { leadSource: string | null; userId: string | null }): { key: string; label: string } {
  if (c.leadSource) return { key: `source:lead_${c.leadSource}`, label: `Lead: ${SOURCE_LABELS[c.leadSource] ?? c.leadSource}` };
  if (c.userId) return { key: 'source:online', label: 'Booked online' };
  return { key: 'source:added', label: 'Added by you' };
}

export function customersReport(rows: { leadSource: string | null; userId: string | null; visitCount: number }[]) {
  const bySource = new Map<string, Group>();
  for (const r of rows) {
    const { key, label } = acquisitionKey(r);
    bump(bySource, key, label);
  }
  return {
    newCustomers: rows.length,
    visited: rows.filter((r) => r.visitCount > 0).length,
    bySource: [...bySource.values()].sort((a, b) => b.count - a.count),
  };
}

export function retentionReport(input: {
  served: { customerId: string; firstCompletedAt: Date }[];
  periodStart: Date;
  allTime: { visitCount: number }[];
  lapsed: number;
}) {
  const returning = input.served.filter((s) => s.firstCompletedAt < input.periodStart).length;
  const withVisits = input.allTime.filter((c) => c.visitCount >= 1).length;
  return {
    served: input.served.length,
    returning,
    firstVisits: input.served.length - returning,
    returningRate: rate(returning, input.served.length),
    repeatRate: rate(input.allTime.filter((c) => c.visitCount >= 2).length, withVisits),
    lapsed: input.lapsed,
    groups: [
      { key: 'segment:returning', label: 'Came back', count: returning },
      { key: 'segment:first', label: 'First visit', count: input.served.length - returning },
      { key: 'segment:lapsed', label: 'Overdue for a visit', count: input.lapsed },
    ],
  };
}
