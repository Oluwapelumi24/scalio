import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq, gt, sql, sum } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, vendors } from '../db/schema';

@Injectable()
export class SuperAdminMetricsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getPlatformMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalVendors] = await this.db.select({ total: count() }).from(vendors);
    const [totalBookings] = await this.db.select({ total: count() }).from(bookings);
    const [totalCustomers] = await this.db.select({ total: count() }).from(customers);

    const [totalRevenue] = await this.db
      .select({ total: sum(bookings.amountPaidKobo) })
      .from(bookings)
      .where(eq(bookings.status, 'completed'));

    const bookingsByStatus = await this.db
      .select({ status: bookings.status, total: count() })
      .from(bookings)
      .groupBy(bookings.status);

    const revenueByVendor = await this.db
      .select({
        vendorId: vendors.id,
        businessName: vendors.businessName,
        totalRevenueKobo: sum(bookings.amountPaidKobo),
        totalBookings: count(bookings.id),
      })
      .from(vendors)
      .leftJoin(bookings, eq(bookings.vendorId, vendors.id))
      .groupBy(vendors.id, vendors.businessName)
      .orderBy(desc(sum(bookings.amountPaidKobo)))
      .limit(10);

    const bookingsTrend = await this.db
      .select({
        day: sql<string>`date_trunc('day', ${bookings.scheduledAt})::date`,
        total: count(),
      })
      .from(bookings)
      .where(gt(bookings.scheduledAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${bookings.scheduledAt})`)
      .orderBy(sql`date_trunc('day', ${bookings.scheduledAt})`);

    return {
      totalVendors: totalVendors?.total ?? 0,
      totalBookings: totalBookings?.total ?? 0,
      totalCustomers: totalCustomers?.total ?? 0,
      totalRevenueKobo: Number(totalRevenue?.total ?? 0),
      bookingsByStatus: Object.fromEntries(bookingsByStatus.map((r) => [r.status, r.total])),
      revenueByVendor,
      bookingsTrend,
    };
  }
}
