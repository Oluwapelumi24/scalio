import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, ledgerEntries, ledgerKindValues, vendors } from '../db/schema';
import { resolvePeriod } from '../staff-schedule/period';

export type LedgerKind = (typeof ledgerKindValues)[number];

export interface LedgerInput {
  vendorId: string;
  kind: LedgerKind;
  direction: 'in' | 'out';
  amountKobo: number;
  occurredAt: Date;
  description: string;
  /** Unique per business: the same event recorded twice is stored once. */
  dedupeKey: string;
  bookingId?: string;
  salaryPayoutId?: string;
  expenseId?: string;
  createdById?: string | null;
}

@Injectable()
export class LedgerService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Inclusive business-calendar dates → the instants they cover, in the business's timezone. */
  async period(vendorId: string, from: string, to: string) {
    const [v] = await this.db.select({ tz: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    return resolvePeriod(from, to, v?.tz ?? 'Africa/Lagos', new Date());
  }

  /** Idempotent: returns false if this event was already recorded. */
  async record(e: LedgerInput): Promise<boolean> {
    const rows = await this.db
      .insert(ledgerEntries)
      .values({ ...e, createdById: e.createdById ?? null })
      .onConflictDoNothing({ target: [ledgerEntries.vendorId, ledgerEntries.dedupeKey] })
      .returning({ id: ledgerEntries.id });
    return rows.length > 0;
  }

  list(vendorId: string, start: Date, end: Date) {
    return this.db
      .select({
        id: ledgerEntries.id,
        kind: ledgerEntries.kind,
        direction: ledgerEntries.direction,
        amountKobo: ledgerEntries.amountKobo,
        occurredAt: ledgerEntries.occurredAt,
        description: ledgerEntries.description,
      })
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.vendorId, vendorId), gte(ledgerEntries.occurredAt, start), lt(ledgerEntries.occurredAt, end)))
      .orderBy(desc(ledgerEntries.occurredAt))
      .limit(200);
  }

  /**
   * Money for a period. Sales are completed bookings at their booked price —
   * paid online or at the appointment. "Received online" is what Paystack
   * settled to the vendor's bank. Salaries and expenses are what was recorded.
   */
  async summary(vendorId: string, start: Date, end: Date) {
    const sumWhere = (kind: LedgerKind, direction: 'in' | 'out') =>
      sql<number>`coalesce(sum(${ledgerEntries.amountKobo}) filter (where ${ledgerEntries.kind} = ${kind} and ${ledgerEntries.direction} = ${direction}), 0)`.mapWith(Number);
    const [[l], [b]] = await Promise.all([
      this.db
        .select({
          onlineIn: sumWhere('booking_payment', 'in'),
          salariesOut: sumWhere('salary', 'out'),
          expensesOut: sumWhere('expense', 'out'),
          expensesReversed: sumWhere('expense', 'in'),
          adjustmentsIn: sumWhere('adjustment', 'in'),
          adjustmentsOut: sumWhere('adjustment', 'out'),
        })
        .from(ledgerEntries)
        .where(and(eq(ledgerEntries.vendorId, vendorId), gte(ledgerEntries.occurredAt, start), lt(ledgerEntries.occurredAt, end))),
      this.db
        .select({ sales: sql<number>`coalesce(sum(${bookings.totalPriceKobo}), 0)`.mapWith(Number) })
        .from(bookings)
        .where(and(eq(bookings.vendorId, vendorId), eq(bookings.status, 'completed'), gte(bookings.scheduledAt, start), lt(bookings.scheduledAt, end))),
    ]);
    const salesKobo = b?.sales ?? 0;
    const salariesKobo = l?.salariesOut ?? 0;
    const expensesKobo = (l?.expensesOut ?? 0) - (l?.expensesReversed ?? 0);
    const adjustmentsKobo = (l?.adjustmentsIn ?? 0) - (l?.adjustmentsOut ?? 0);
    return {
      salesKobo,
      receivedOnlineKobo: l?.onlineIn ?? 0,
      salariesKobo,
      expensesKobo,
      netKobo: salesKobo - salariesKobo - expensesKobo + adjustmentsKobo,
    };
  }
}
