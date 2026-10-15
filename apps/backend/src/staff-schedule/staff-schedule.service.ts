import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gte } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { staff, staffTimeOff, staffWorkingHours, vendors } from '../db/schema';
import type { CreateTimeOffDto } from './dto/create-time-off.dto';
import type { StaffDayDto } from './dto/set-staff-schedule.dto';
import { businessToday } from './period';

/** Validates a weekly pattern; returns a reason it's invalid, or null. */
export function scheduleProblem(days: StaffDayDto[]): string | null {
  const seen = new Set<number>();
  for (const d of days) {
    if (seen.has(d.dayOfWeek)) return 'Each day can only appear once.';
    seen.add(d.dayOfWeek);
    if (d.endsAtMinutes <= d.startsAtMinutes) return 'A shift must end after it starts.';
    const hasStart = d.breakStartsAtMinutes != null;
    const hasEnd = d.breakEndsAtMinutes != null;
    if (hasStart !== hasEnd) return 'A break needs both a start and an end time.';
    if (hasStart) {
      if (d.breakEndsAtMinutes! <= d.breakStartsAtMinutes!) return 'A break must end after it starts.';
      if (d.breakStartsAtMinutes! < d.startsAtMinutes || d.breakEndsAtMinutes! > d.endsAtMinutes) {
        return 'A break must fall inside the shift.';
      }
    }
  }
  return null;
}

@Injectable()
export class StaffScheduleService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** 404s for staff outside this business, so other businesses' staff can't be probed. */
  async assertStaff(vendorId: string, staffId: string) {
    const [member] = await this.db
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.vendorId, vendorId)));
    if (!member) throw new NotFoundException('Staff member not found');
    return member;
  }

  async getSchedule(vendorId: string, staffId: string) {
    const member = await this.assertStaff(vendorId, staffId);
    const [vendor] = await this.db.select({ timezone: vendors.timezone }).from(vendors).where(eq(vendors.id, vendorId));
    const today = businessToday(new Date(), vendor?.timezone ?? 'Africa/Lagos');

    const [days, timeOff] = await Promise.all([
      this.db
        .select({
          dayOfWeek: staffWorkingHours.dayOfWeek,
          startsAtMinutes: staffWorkingHours.startsAtMinutes,
          endsAtMinutes: staffWorkingHours.endsAtMinutes,
          breakStartsAtMinutes: staffWorkingHours.breakStartsAtMinutes,
          breakEndsAtMinutes: staffWorkingHours.breakEndsAtMinutes,
        })
        .from(staffWorkingHours)
        .where(eq(staffWorkingHours.staffId, staffId))
        .orderBy(asc(staffWorkingHours.dayOfWeek)),
      // Current and upcoming leave only; past leave stays in the table for reports.
      this.db
        .select({ id: staffTimeOff.id, startDate: staffTimeOff.startDate, endDate: staffTimeOff.endDate, reason: staffTimeOff.reason })
        .from(staffTimeOff)
        .where(and(eq(staffTimeOff.staffId, staffId), gte(staffTimeOff.endDate, today)))
        .orderBy(asc(staffTimeOff.startDate)),
    ]);

    return { staffId, name: member.name, days, timeOff };
  }

  async setSchedule(vendorId: string, staffId: string, days: StaffDayDto[]) {
    await this.assertStaff(vendorId, staffId);
    const problem = scheduleProblem(days);
    if (problem) throw new BadRequestException(problem);

    // Whole-week swap in one transaction, like business hours.
    await this.db.transaction(async (tx) => {
      await tx.delete(staffWorkingHours).where(eq(staffWorkingHours.staffId, staffId));
      if (days.length > 0) {
        await tx.insert(staffWorkingHours).values(
          days.map((d) => ({
            vendorId,
            staffId,
            dayOfWeek: d.dayOfWeek,
            startsAtMinutes: d.startsAtMinutes,
            endsAtMinutes: d.endsAtMinutes,
            breakStartsAtMinutes: d.breakStartsAtMinutes ?? null,
            breakEndsAtMinutes: d.breakEndsAtMinutes ?? null,
          })),
        );
      }
    });
    return this.getSchedule(vendorId, staffId);
  }

  async addTimeOff(vendorId: string, staffId: string, dto: CreateTimeOffDto) {
    await this.assertStaff(vendorId, staffId);
    const startDate = dto.startDate.slice(0, 10);
    const endDate = dto.endDate.slice(0, 10);
    if (endDate < startDate) throw new BadRequestException('Time off must end on or after the day it starts.');
    const [row] = await this.db
      .insert(staffTimeOff)
      .values({ vendorId, staffId, startDate, endDate, reason: dto.reason ?? null })
      .returning({ id: staffTimeOff.id, startDate: staffTimeOff.startDate, endDate: staffTimeOff.endDate, reason: staffTimeOff.reason });
    return row;
  }

  async removeTimeOff(vendorId: string, staffId: string, timeOffId: string) {
    const deleted = await this.db
      .delete(staffTimeOff)
      .where(and(eq(staffTimeOff.id, timeOffId), eq(staffTimeOff.staffId, staffId), eq(staffTimeOff.vendorId, vendorId)))
      .returning({ id: staffTimeOff.id });
    if (deleted.length === 0) throw new NotFoundException('Time off not found');
  }
}
