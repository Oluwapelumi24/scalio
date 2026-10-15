import { and, eq, gte, lte } from 'drizzle-orm';
import type { Database } from '../db/db.module';
import { staffTimeOff, staffWorkingHours } from '../db/schema';
import type { StaffDayContext } from '../vendor/availability';

/**
 * Loads what `staffWorkingWindow` needs for one staff member on one date.
 * Shared by availability (what to offer) and booking creation (what to accept),
 * so the two can never disagree.
 */
export async function loadStaffDay(db: Database, staffId: string, isoDate: string): Promise<StaffDayContext> {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  const [pattern, leave] = await Promise.all([
    db
      .select({
        dayOfWeek: staffWorkingHours.dayOfWeek,
        startsAtMinutes: staffWorkingHours.startsAtMinutes,
        endsAtMinutes: staffWorkingHours.endsAtMinutes,
        breakStartsAtMinutes: staffWorkingHours.breakStartsAtMinutes,
        breakEndsAtMinutes: staffWorkingHours.breakEndsAtMinutes,
      })
      .from(staffWorkingHours)
      .where(eq(staffWorkingHours.staffId, staffId)),
    db
      .select({ id: staffTimeOff.id })
      .from(staffTimeOff)
      .where(
        and(
          eq(staffTimeOff.staffId, staffId),
          lte(staffTimeOff.startDate, isoDate),
          gte(staffTimeOff.endDate, isoDate),
        ),
      ),
  ]);

  return {
    hasSchedule: pattern.length > 0,
    day: pattern.find((p) => p.dayOfWeek === dayOfWeek),
    onTimeOff: leave.length > 0,
  };
}
