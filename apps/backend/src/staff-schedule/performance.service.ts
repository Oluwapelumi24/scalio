import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { attendanceRecords, bookings, feedbackRequests, staff, staffTimeOff, staffWorkingHours, vendors } from '../db/schema';
import { summariseRatings } from '../feedback/feedback.service';
import { computePerformance, METRIC_DEFINITIONS } from './performance';
import { businessToday, resolvePeriod } from './period';

@Injectable()
export class PerformanceService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * @param staffId narrows to one person (always set for practitioners).
   * @param serviceId narrows to bookings that include that service.
   */
  async get(vendorId: string, query: { from: string; to: string; staffId?: string; serviceId?: string }) {
    const now = new Date();
    const [vendor] = await this.db.select({ timezone: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    const range = resolvePeriod(query.from, query.to, vendor?.timezone ?? 'Africa/Lagos', now);

    const staffConditions = [eq(staff.vendorId, vendorId)];
    if (query.staffId) staffConditions.push(eq(staff.id, query.staffId));

    const bookingConditions = [
      eq(bookings.vendorId, vendorId),
      gte(bookings.scheduledAt, range.start),
      lt(bookings.scheduledAt, range.end),
    ];
    if (query.staffId) bookingConditions.push(eq(bookings.staffId, query.staffId));
    if (query.serviceId) bookingConditions.push(sql`${query.serviceId}::uuid = any(${bookings.serviceIds})`);

    const [members, bookingRows, shifts, pattern, timeOff, [firstShift]] = await Promise.all([
      this.db.select({ id: staff.id, name: staff.name, role: staff.role }).from(staff).where(and(...staffConditions)).orderBy(asc(staff.name)),
      this.db
        .select({
          staffId: bookings.staffId,
          customerId: bookings.customerId,
          status: bookings.status,
          scheduledAt: bookings.scheduledAt,
          totalPriceKobo: bookings.totalPriceKobo,
        })
        .from(bookings)
        .where(and(...bookingConditions)),
      this.db
        .select({ staffId: attendanceRecords.staffId, clockInAt: attendanceRecords.clockInAt, clockOutAt: attendanceRecords.clockOutAt })
        .from(attendanceRecords)
        .where(and(eq(attendanceRecords.vendorId, vendorId), gte(attendanceRecords.clockInAt, range.start), lt(attendanceRecords.clockInAt, range.end))),
      this.db.select().from(staffWorkingHours).where(eq(staffWorkingHours.vendorId, vendorId)),
      this.db
        .select({ staffId: staffTimeOff.staffId, startDate: staffTimeOff.startDate, endDate: staffTimeOff.endDate })
        .from(staffTimeOff)
        .where(and(eq(staffTimeOff.vendorId, vendorId), lte(staffTimeOff.startDate, range.toDate), gte(staffTimeOff.endDate, range.fromDate))),
      // Attendance only means something from the day the business started clocking in.
      this.db
        .select({ first: sql<Date | null>`min(${attendanceRecords.clockInAt})` })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.vendorId, vendorId)),
    ]);

    const patterns = new Map<string, typeof pattern>();
    for (const p of pattern) patterns.set(p.staffId, [...(patterns.get(p.staffId) ?? []), p]);

    const timezone = vendor?.timezone ?? 'Africa/Lagos';
    const attendanceSince = firstShift?.first ? businessToday(new Date(firstShift.first), timezone) : null;

    // Ratings for the same bookings (by visit date, with the same staff/service filters).
    const ratingRows = await this.db
      .select({ staffId: feedbackRequests.staffId, rating: feedbackRequests.rating })
      .from(feedbackRequests)
      .innerJoin(bookings, eq(bookings.id, feedbackRequests.bookingId))
      .where(and(...bookingConditions, sql`${feedbackRequests.rating} is not null`));
    const ratingFor = (staffId: string | null) => {
      const s = summariseRatings(ratingRows.filter((r) => r.staffId === staffId).map((r) => r.rating!));
      return s.count ? { average: s.average, count: s.count } : null;
    };

    const rows = computePerformance({
      staff: members,
      bookings: bookingRows,
      shifts,
      patterns,
      timeOff,
      range,
      attendanceSince,
      now,
    });

    return {
      from: range.fromDate,
      to: range.toDate,
      definitions: METRIC_DEFINITIONS,
      tracksAttendance: attendanceSince !== null,
      attendanceSince,
      staff: rows.map((r) => ({ ...r, rating: ratingFor(r.staffId) })),
    };
  }
}
