import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, asc, count, eq, gt, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { attendanceRecords, bookings, businessHours, customers, services, staff, staffTimeOff, vendors } from '../db/schema';
import { businessDayBounds } from '../common/business-day';
import type { HomeSnapshot } from './home';

const DAY_MS = 86_400_000;
const DEFAULT_RETURN_INTERVAL_DAYS = 45;

/** Loads the real figures the home screen is built from. All queries are vendor-scoped. */
@Injectable()
export class HomeDataService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  bookingLinkFor(slug: string): string {
    const base = this.config.get<string>('PUBLIC_BOOKING_URL') ?? 'http://localhost:3003/book';
    return `${base.replace(/\/$/, '')}/${slug}`;
  }

  /**
   * @param viewerStaffId whoever is looking — for their own clock-in status.
   * @param practitionerStaffId when set, booking figures cover only this staff
   *   member's bookings (practitioners see their own work, as in the bookings list).
   */
  async load(vendorId: string, now: Date, viewerStaffId: string, practitionerStaffId?: string): Promise<HomeSnapshot> {
    const [vendor] = await this.db
      .select({
        slug: vendors.slug,
        businessName: vendors.businessName,
        timezone: vendors.timezone,
        averageDaysBetweenVisits: vendors.averageDaysBetweenVisits,
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');

    const { start, end } = businessDayBounds(now, vendor.timezone);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
    const inAnHour = new Date(now.getTime() + 60 * 60_000);
    const returnInterval = vendor.averageDaysBetweenVisits ?? DEFAULT_RETURN_INTERVAL_DAYS;
    const lapsedBefore = new Date(now.getTime() - returnInterval * DAY_MS);

    const bookingScope: SQL[] = [eq(bookings.vendorId, vendorId)];
    if (practitionerStaffId) bookingScope.push(eq(bookings.staffId, practitionerStaffId));

    const isToday = sql`${bookings.scheduledAt} >= ${start} and ${bookings.scheduledAt} < ${end}`;
    const countWhere = (cond: SQL) => sql<number>`count(*) filter (where ${cond})`.mapWith(Number);
    const sumValueWhere = (cond: SQL) =>
      sql<number>`coalesce(sum(${bookings.totalPriceKobo}) filter (where ${cond}), 0)`.mapWith(Number);

    const [b] = await this.db
      .select({
        total: count(),
        sales30d: sumValueWhere(sql`${bookings.scheduledAt} >= ${thirtyDaysAgo} and ${bookings.status} = 'completed'`),
        awaitingPayment: countWhere(sql`${bookings.status} = 'pending_payment' and ${bookings.scheduledAt} > ${now}`),
        startingSoon: countWhere(
          sql`${bookings.status} = 'confirmed' and ${bookings.scheduledAt} > ${now} and ${bookings.scheduledAt} <= ${inAnHour}`,
        ),
        unassignedToday: countWhere(
          sql`${isToday} and ${bookings.staffId} is null and ${bookings.status} in ('pending_payment', 'confirmed')`,
        ),
      })
      .from(bookings)
      .where(and(...bookingScope));

    const upcomingRows = await this.db
      .select({
        id: bookings.id,
        scheduledAt: bookings.scheduledAt,
        status: bookings.status,
        customerName: customers.name,
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .where(
        and(
          ...bookingScope,
          inArray(bookings.status, ['pending_payment', 'confirmed']),
          gt(bookings.scheduledAt, now),
        ),
      )
      .orderBy(asc(bookings.scheduledAt))
      .limit(5);

    const [c] = await this.db
      .select({
        total: count(),
        repeat: countWhere(sql`${customers.visitCount} >= 2`),
        new30d: countWhere(sql`${customers.createdAt} >= ${thirtyDaysAgo}`),
        lapsed: countWhere(sql`${customers.visitCount} >= 1 and ${customers.lastVisitAt} < ${lapsedBefore}`),
      })
      .from(customers)
      .where(eq(customers.vendorId, vendorId));

    const inTwoWeeks = new Date(now.getTime() + 14 * DAY_MS);
    // A booking clashes with leave when its date, in the business's calendar,
    // falls inside a time-off range for the staff member it's assigned to.
    const [[leaveRow], [openShift]] = await Promise.all([
      this.db
        .select({ n: count() })
        .from(bookings)
        .innerJoin(
          staffTimeOff,
          and(
            eq(staffTimeOff.staffId, bookings.staffId),
            sql`(${bookings.scheduledAt} at time zone ${vendor.timezone})::date between ${staffTimeOff.startDate} and ${staffTimeOff.endDate}`,
          ),
        )
        .where(
          and(
            ...bookingScope,
            inArray(bookings.status, ['pending_payment', 'confirmed']),
            gt(bookings.scheduledAt, now),
            sql`${bookings.scheduledAt} <= ${inTwoWeeks}`,
          ),
        ),
      this.db
        .select({ id: attendanceRecords.id })
        .from(attendanceRecords)
        .where(and(eq(attendanceRecords.staffId, viewerStaffId), isNull(attendanceRecords.clockOutAt))),
    ]);

    const [[staffRow], [serviceRow], [hoursRow]] = await Promise.all([
      this.db.select({ n: count() }).from(staff).where(eq(staff.vendorId, vendorId)),
      this.db.select({ n: count() }).from(services).where(eq(services.vendorId, vendorId)),
      this.db.select({ n: count() }).from(businessHours).where(eq(businessHours.vendorId, vendorId)),
    ]);

    return {
      businessName: vendor.businessName,
      bookingLink: this.bookingLinkFor(vendor.slug),
      sales30dKobo: b?.sales30d ?? 0,
      upcoming: upcomingRows.map((r) => ({
        id: r.id,
        scheduledAt: r.scheduledAt.toISOString(),
        status: r.status,
        customerName: r.customerName,
      })),
      totalBookings: b?.total ?? 0,
      awaitingPayment: b?.awaitingPayment ?? 0,
      startingSoon: b?.startingSoon ?? 0,
      unassignedToday: b?.unassignedToday ?? 0,
      bookingsOnLeave: leaveRow?.n ?? 0,
      viewerClockedIn: !!openShift,
      totalCustomers: c?.total ?? 0,
      repeatCustomers: c?.repeat ?? 0,
      newCustomers30d: c?.new30d ?? 0,
      lapsedCustomers: c?.lapsed ?? 0,
      staffCount: staffRow?.n ?? 0,
      serviceCount: serviceRow?.n ?? 0,
      hasBusinessHours: (hoursRow?.n ?? 0) > 0,
    };
  }
}
