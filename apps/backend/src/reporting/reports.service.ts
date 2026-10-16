import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, sql, type SQL } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, expenses, ledgerEntries, leads, services, staff, vendors } from '../db/schema';
import { businessToday, resolvePeriod } from '../staff-schedule/period';
import {
  REPORT_DEFINITIONS, acquisitionKey, bookingsReport, cashflowReport, customersReport, expensesReport, retentionReport, salesReport,
  splitByService, type ReportKind,
} from './reports';

const DEFAULT_RETURN_DAYS = 45;
const RECORD_LIMIT = 500;

@Injectable()
export class ReportsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async context(vendorId: string, from: string, to: string) {
    const [v] = await this.db.select({ tz: vendors.timezone, gap: vendors.averageDaysBetweenVisits }).from(vendors).where(eq(vendors.id, vendorId));
    const tz = v?.tz ?? 'Africa/Lagos';
    const now = new Date();
    return { tz, now, range: resolvePeriod(from, to, tz, now), returnDays: v?.gap ?? DEFAULT_RETURN_DAYS };
  }

  /** 0 = Monday … 6 = Sunday, in the business's calendar. */
  private weekday(d: Date, tz: string): number {
    const name = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long' }).format(d);
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(name);
  }

  private inPeriod(col: Parameters<typeof gte>[0], start: Date, end: Date): SQL {
    return and(gte(col, start), lt(col, end))!;
  }

  private completedInPeriod(vendorId: string, start: Date, end: Date) {
    return this.db
      .select({ id: bookings.id, totalPriceKobo: bookings.totalPriceKobo, serviceIds: bookings.serviceIds, staffId: bookings.staffId, scheduledAt: bookings.scheduledAt, customerId: bookings.customerId })
      .from(bookings)
      .where(and(eq(bookings.vendorId, vendorId), eq(bookings.status, 'completed'), this.inPeriod(bookings.scheduledAt, start, end)));
  }

  private async lookups(vendorId: string) {
    const [svc, people] = await Promise.all([
      this.db.select({ id: services.id, name: services.name, priceKobo: services.priceKobo }).from(services).where(eq(services.vendorId, vendorId)),
      this.db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.vendorId, vendorId)),
    ]);
    return { services: new Map(svc.map((s) => [s.id, { name: s.name, priceKobo: s.priceKobo }])), staffNames: new Map(people.map((p) => [p.id, p.name])) };
  }

  /** Customers with a lead source (from a converted lead) and app link, for acquisition. */
  private customersWithSource(where: SQL) {
    return this.db
      .select({
        id: customers.id, name: customers.name, phone: customers.phone, email: customers.email, userId: customers.userId,
        visitCount: customers.visitCount, lastVisitAt: customers.lastVisitAt, createdAt: customers.createdAt,
        leadSource: sql<string | null>`(select ${leads.source} from ${leads} where ${leads.customerId} = ${customers.id} order by ${leads.convertedAt} asc limit 1)`,
      })
      .from(customers)
      .where(where);
  }

  private lapsedCondition(vendorId: string, returnDays: number, now: Date): SQL {
    return and(eq(customers.vendorId, vendorId), gte(customers.visitCount, 1), lt(customers.lastVisitAt, new Date(now.getTime() - returnDays * 86_400_000)))!;
  }

  /** People served in the period, with the date of their first-ever completed booking. */
  private served(vendorId: string, start: Date, end: Date) {
    return this.db
      .select({
        customerId: bookings.customerId,
        firstCompletedAt: sql<Date>`(select min(b2.scheduled_at) from bookings b2 where b2.customer_id = ${bookings.customerId} and b2.status = 'completed')`.mapWith((v: string | Date) => new Date(v)),
      })
      .from(bookings)
      .where(and(eq(bookings.vendorId, vendorId), eq(bookings.status, 'completed'), this.inPeriod(bookings.scheduledAt, start, end)))
      .groupBy(bookings.customerId);
  }

  async overview(vendorId: string, from: string, to: string) {
    const { tz, now, range, returnDays } = await this.context(vendorId, from, to);
    const { start, end } = range;
    const [completed, allBookings, expenseRows, ledgerRows, newCustomers, served, allTime, [lapsed], look] = await Promise.all([
      this.completedInPeriod(vendorId, start, end),
      this.db.select({ status: bookings.status, scheduledAt: bookings.scheduledAt }).from(bookings).where(and(eq(bookings.vendorId, vendorId), this.inPeriod(bookings.scheduledAt, start, end))),
      this.db.select({ category: expenses.category, amountKobo: expenses.amountKobo }).from(expenses)
        .where(and(eq(expenses.vendorId, vendorId), isNull(expenses.voidedAt), gte(expenses.spentOn, range.fromDate), lte(expenses.spentOn, range.toDate))),
      this.db.select({ kind: ledgerEntries.kind, direction: ledgerEntries.direction, amountKobo: ledgerEntries.amountKobo, occurredAt: ledgerEntries.occurredAt }).from(ledgerEntries)
        .where(and(eq(ledgerEntries.vendorId, vendorId), this.inPeriod(ledgerEntries.occurredAt, start, end))),
      this.customersWithSource(and(eq(customers.vendorId, vendorId), this.inPeriod(customers.createdAt, start, end))!),
      this.served(vendorId, start, end),
      this.db.select({ visitCount: customers.visitCount }).from(customers).where(eq(customers.vendorId, vendorId)),
      this.db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(customers).where(this.lapsedCondition(vendorId, returnDays, now)),
      this.lookups(vendorId),
    ]);

    return {
      from: range.fromDate,
      to: range.toDate,
      definitions: REPORT_DEFINITIONS,
      sales: salesReport(completed.map((b) => ({ ...b, date: businessToday(b.scheduledAt, tz) })), look.services, look.staffNames),
      bookings: bookingsReport(allBookings.map((b) => ({ status: b.status, weekday: this.weekday(b.scheduledAt, tz) }))),
      expenses: expensesReport(expenseRows),
      cashflow: cashflowReport(ledgerRows.map((r) => ({ ...r, date: businessToday(r.occurredAt, tz) }))),
      customers: customersReport(newCustomers),
      retention: retentionReport({ served, periodStart: start, allTime, lapsed: lapsed?.n ?? 0 }),
    };
  }

  /** The records behind one group of a report, e.g. `sales` + `service:<id>`. No key lists them all. */
  async records(vendorId: string, kind: ReportKind, key: string | undefined, from: string, to: string) {
    const { tz, now, range, returnDays } = await this.context(vendorId, from, to);
    const { start, end } = range;
    const [type, ...rest] = (key ?? '').split(':');
    const value = rest.join(':');

    switch (kind) {
      case 'sales': {
        const [rows, look] = await Promise.all([this.completedInPeriod(vendorId, start, end).orderBy(desc(bookings.scheduledAt)), this.lookups(vendorId)]);
        const prices = new Map([...look.services].map(([id, s]) => [id, s.priceKobo]));
        const matching = rows.filter((b) =>
          !key ? true
            : type === 'service' ? b.serviceIds.includes(value)
            : type === 'staff' ? (value === 'unassigned' ? b.staffId === null : b.staffId === value)
            : type === 'day' ? businessToday(b.scheduledAt, tz) === value
            : badKey(key));
        const names = await this.customerNames(matching.map((b) => b.customerId));
        return matching.slice(0, RECORD_LIMIT).map((b) => ({
          type: 'booking' as const, id: b.id, at: b.scheduledAt.toISOString(), customerName: names.get(b.customerId) ?? null,
          staffName: b.staffId ? look.staffNames.get(b.staffId) ?? null : null,
          services: b.serviceIds.map((id) => look.services.get(id)?.name ?? 'Removed service'),
          // For a service group, show that service's share of the booking; otherwise the whole booking.
          amountKobo: type === 'service' ? splitByService(b.totalPriceKobo, b.serviceIds, prices).get(value) ?? 0 : b.totalPriceKobo,
        }));
      }
      case 'bookings': {
        const where: SQL[] = [eq(bookings.vendorId, vendorId), this.inPeriod(bookings.scheduledAt, start, end)];
        if (type === 'status') where.push(eq(bookings.status, value as (typeof bookings.$inferSelect)['status']));
        else if (key && type !== 'weekday') badKey(key);
        const rows = await this.db
          .select({ id: bookings.id, status: bookings.status, scheduledAt: bookings.scheduledAt, totalPriceKobo: bookings.totalPriceKobo, customerName: customers.name, reason: bookings.cancellationReason })
          .from(bookings).innerJoin(customers, eq(customers.id, bookings.customerId))
          .where(and(...where)).orderBy(desc(bookings.scheduledAt));
        return rows
          .filter((b) => type !== 'weekday' || (!b.status.startsWith('cancelled') && this.weekday(b.scheduledAt, tz) === Number(value)))
          .slice(0, RECORD_LIMIT)
          .map((b) => ({ type: 'booking' as const, id: b.id, at: b.scheduledAt.toISOString(), status: b.status, customerName: b.customerName, amountKobo: b.totalPriceKobo, note: b.reason }));
      }
      case 'expenses': {
        const where: SQL[] = [eq(expenses.vendorId, vendorId), isNull(expenses.voidedAt), gte(expenses.spentOn, range.fromDate), lte(expenses.spentOn, range.toDate)];
        if (type === 'category') where.push(eq(expenses.category, value));
        else if (key) badKey(key);
        const rows = await this.db.select().from(expenses).where(and(...where)).orderBy(desc(expenses.spentOn)).limit(RECORD_LIMIT);
        return rows.map((e) => ({ type: 'expense' as const, id: e.id, at: e.spentOn, label: e.category, note: e.note, amountKobo: e.amountKobo }));
      }
      case 'cashflow': {
        const where: SQL[] = [eq(ledgerEntries.vendorId, vendorId), this.inPeriod(ledgerEntries.occurredAt, start, end)];
        if (type === 'kind') {
          const [k, dir] = value.split(':');
          where.push(eq(ledgerEntries.kind, k as (typeof ledgerEntries.$inferSelect)['kind']), eq(ledgerEntries.direction, dir as 'in' | 'out'));
        } else if (key) badKey(key);
        const rows = await this.db.select().from(ledgerEntries).where(and(...where)).orderBy(desc(ledgerEntries.occurredAt)).limit(RECORD_LIMIT);
        return rows.map((r) => ({ type: 'ledger' as const, id: r.id, at: r.occurredAt.toISOString(), label: r.description, direction: r.direction, amountKobo: r.amountKobo, bookingId: r.bookingId }));
      }
      case 'customers': {
        if (key && type !== 'source') badKey(key);
        const rows = await this.customersWithSource(and(eq(customers.vendorId, vendorId), this.inPeriod(customers.createdAt, start, end))!).orderBy(desc(customers.createdAt));
        return rows
          .filter((c) => !key || acquisitionKey(c).key === key)
          .slice(0, RECORD_LIMIT)
          .map((c) => ({ type: 'customer' as const, id: c.id, name: c.name, phone: c.phone, at: c.createdAt.toISOString(), label: acquisitionKey(c).label, visits: c.visitCount }));
      }
      case 'retention': {
        let ids: string[];
        if (value === 'lapsed') {
          const rows = await this.db.select({ id: customers.id }).from(customers).where(this.lapsedCondition(vendorId, returnDays, now)).orderBy(asc(customers.lastVisitAt)).limit(RECORD_LIMIT);
          ids = rows.map((r) => r.id);
        } else if (value === 'returning' || value === 'first' || !key) {
          const served = await this.served(vendorId, start, end);
          ids = served.filter((s) => !key || (value === 'returning') === (s.firstCompletedAt < start)).map((s) => s.customerId);
        } else badKey(key);
        if (ids.length === 0) return [];
        const rows = await this.db
          .select({ id: customers.id, name: customers.name, phone: customers.phone, visitCount: customers.visitCount, lastVisitAt: customers.lastVisitAt, lifetimeValueKobo: customers.lifetimeValueKobo })
          .from(customers).where(and(eq(customers.vendorId, vendorId), inArray(customers.id, ids.slice(0, RECORD_LIMIT))))
          .orderBy(desc(customers.lastVisitAt));
        return rows.map((c) => ({ type: 'customer' as const, id: c.id, name: c.name, phone: c.phone, at: c.lastVisitAt?.toISOString() ?? null, visits: c.visitCount, amountKobo: c.lifetimeValueKobo }));
      }
    }
  }

  private async customerNames(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map<string, string>();
    const rows = await this.db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, unique));
    return new Map(rows.map((r) => [r.id, r.name]));
  }
}

function badKey(key: string): never {
  throw new BadRequestException(`Unknown report group "${key}".`);
}
