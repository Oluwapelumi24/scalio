import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { businessDayBounds } from '../common/business-day';
import { DB, type Database } from '../db/db.module';
import { bookings, vendors } from '../db/schema';

export interface TodaySummary {
  date: string;
  bookings: number;
  /** Value of today's completed bookings; null for roles that don't see money. */
  salesKobo: number | null;
}

/** Today's headline figures for the Bookings screen, in the business's own day. */
@Injectable()
export class BookingsSummaryService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async today(vendorId: string, opts: { now?: Date; staffId?: string; includeSales: boolean }): Promise<TodaySummary> {
    const now = opts.now ?? new Date();
    const [vendor] = await this.db.select({ timezone: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    const { start, end } = businessDayBounds(now, vendor.timezone);

    const scope: SQL[] = [eq(bookings.vendorId, vendorId)];
    if (opts.staffId) scope.push(eq(bookings.staffId, opts.staffId));
    const isToday = sql`${bookings.scheduledAt} >= ${start} and ${bookings.scheduledAt} < ${end}`;

    const [row] = await this.db
      .select({
        bookings: sql<number>`count(*) filter (where ${isToday} and ${bookings.status} in ('pending_payment', 'confirmed', 'completed'))`.mapWith(Number),
        sales: sql<number>`coalesce(sum(${bookings.totalPriceKobo}) filter (where ${isToday} and ${bookings.status} = 'completed'), 0)`.mapWith(Number),
      })
      .from(bookings)
      .where(and(...scope));

    return {
      date: new Intl.DateTimeFormat('en-CA', { timeZone: vendor.timezone }).format(now),
      bookings: row?.bookings ?? 0,
      salesKobo: opts.includeSales ? (row?.sales ?? 0) : null,
    };
  }
}
