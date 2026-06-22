import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gt, sql, sum } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings } from '../db/schema';

@Injectable()
export class VendorMetricsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getVendorMetrics(vendorId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totals] = await this.db
      .select({ total: count() })
      .from(bookings)
      .where(eq(bookings.vendorId, vendorId));

    const statusRows = await this.db
      .select({ status: bookings.status, total: count() })
      .from(bookings)
      .where(eq(bookings.vendorId, vendorId))
      .groupBy(bookings.status);

    const [upcoming] = await this.db
      .select({ total: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.vendorId, vendorId),
          eq(bookings.status, 'confirmed'),
          gt(bookings.scheduledAt, new Date()),
        ),
      );

    const [revenue] = await this.db
      .select({ total: sum(bookings.amountPaidKobo) })
      .from(bookings)
      .where(
        and(
          eq(bookings.vendorId, vendorId),
          eq(bookings.status, 'completed'),
          gt(bookings.createdAt, thirtyDaysAgo),
        ),
      );

    return {
      totalBookings: totals?.total ?? 0,
      bookingsByStatus: Object.fromEntries(statusRows.map((r) => [r.status, r.total])),
      upcomingCount: upcoming?.total ?? 0,
      revenueLast30DaysKobo: Number(revenue?.total ?? 0),
    };
  }
}
