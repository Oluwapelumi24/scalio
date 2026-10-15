import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { attendanceRecords, staff, vendors } from '../db/schema';
import { resolvePeriod } from './period';
import { StaffScheduleService } from './staff-schedule.service';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly schedules: StaffScheduleService,
  ) {}

  async status(vendorId: string, staffId: string) {
    await this.schedules.assertStaff(vendorId, staffId);
    const [open] = await this.db
      .select({ id: attendanceRecords.id, clockInAt: attendanceRecords.clockInAt })
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.staffId, staffId), isNull(attendanceRecords.clockOutAt)));
    return { staffId, clockedIn: !!open, since: open?.clockInAt ?? null };
  }

  async clockIn(vendorId: string, staffId: string, recordedById: string, now = new Date()) {
    await this.schedules.assertStaff(vendorId, staffId);
    try {
      const [row] = await this.db
        .insert(attendanceRecords)
        .values({ vendorId, staffId, clockInAt: now, source: recordedById === staffId ? 'self' : 'manager', recordedById })
        .returning();
      return row;
    } catch {
      // The partial unique index allows one open shift per person.
      throw new ConflictException('Already clocked in.');
    }
  }

  async clockOut(vendorId: string, staffId: string, now = new Date()) {
    await this.schedules.assertStaff(vendorId, staffId);
    const [row] = await this.db
      .update(attendanceRecords)
      .set({ clockOutAt: now })
      .where(and(eq(attendanceRecords.staffId, staffId), eq(attendanceRecords.vendorId, vendorId), isNull(attendanceRecords.clockOutAt)))
      .returning();
    if (!row) throw new ConflictException('Not clocked in.');
    return row;
  }

  /** Everyone in the business and whether they're on shift right now. */
  async team(vendorId: string) {
    const [members, open] = await Promise.all([
      this.db
        .select({ id: staff.id, name: staff.name, role: staff.role })
        .from(staff)
        .where(eq(staff.vendorId, vendorId))
        .orderBy(asc(staff.name)),
      this.db
        .select({ staffId: attendanceRecords.staffId, clockInAt: attendanceRecords.clockInAt })
        .from(attendanceRecords)
        .where(and(eq(attendanceRecords.vendorId, vendorId), isNull(attendanceRecords.clockOutAt))),
    ]);
    const since = new Map(open.map((o) => [o.staffId, o.clockInAt]));
    return members.map((m) => ({ ...m, clockedIn: since.has(m.id), since: since.get(m.id) ?? null }));
  }

  async list(vendorId: string, from: string, to: string, staffId?: string) {
    const [vendor] = await this.db.select({ timezone: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    const range = resolvePeriod(from, to, vendor?.timezone ?? 'Africa/Lagos', new Date());
    const conditions = [
      eq(attendanceRecords.vendorId, vendorId),
      gte(attendanceRecords.clockInAt, range.start),
      lt(attendanceRecords.clockInAt, range.end),
    ];
    if (staffId) conditions.push(eq(attendanceRecords.staffId, staffId));

    return this.db
      .select({
        id: attendanceRecords.id,
        staffId: attendanceRecords.staffId,
        staffName: staff.name,
        clockInAt: attendanceRecords.clockInAt,
        clockOutAt: attendanceRecords.clockOutAt,
        source: attendanceRecords.source,
      })
      .from(attendanceRecords)
      .innerJoin(staff, eq(attendanceRecords.staffId, staff.id))
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.clockInAt));
  }
}
