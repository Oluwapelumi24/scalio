import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import {
  vendors,
  services,
  bookings,
  businessHours,
  blackoutDates,
  ACTIVE_BOOKING_STATUSES,
} from '../db/schema';
import {
  computeAvailableSlotOffsets,
  dateFromOffset,
  minutesSinceMidnight,
  type BusyInterval,
  type OpenHours,
} from './availability';

export interface AvailabilityQuery {
  date: string;
  serviceIds?: string[];
  staffId?: string;
}

@Injectable()
export class VendorService {
  constructor(@Inject(DB) private readonly db: Database) {}

  // TODO: paginate + support search/category/location filters once the
  // vendor directory grows beyond what a single page can hold.
  async list() {
    return this.db.select().from(vendors);
  }

  async getById(vendorId: string) {
    const [vendor] = await this.db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!vendor) {
      throw new NotFoundException(`Vendor ${vendorId} not found`);
    }
    return vendor;
  }

  async listServices(vendorId: string) {
    await this.getById(vendorId); // 404s if the vendor doesn't exist
    return this.db
      .select()
      .from(services)
      .where(eq(services.vendorId, vendorId));
  }

  /**
   * Open time slots for a given day, derived from real booking data (not a
   * placeholder): the vendor's configured hours for that weekday (falling
   * back to the platform default if they haven't set any) minus whatever's
   * already pending/confirmed — and nothing at all on a blacked-out date.
   * Per-staff schedules are still TODO (see availability.ts).
   */
  async getAvailability(vendorId: string, query: AvailabilityQuery) {
    await this.getById(vendorId);

    const durationMinutes = await this.resolveDurationMinutes(
      vendorId,
      query.serviceIds,
    );

    const dayStart = dateFromOffset(query.date, 0);
    const dayEnd = dateFromOffset(query.date, 24 * 60);

    const [blackout] = await this.db
      .select({ id: blackoutDates.id })
      .from(blackoutDates)
      .where(
        and(
          eq(blackoutDates.vendorId, vendorId),
          eq(blackoutDates.date, query.date),
        ),
      );
    if (blackout) {
      return { date: query.date, durationMinutes, slots: [] };
    }

    const hours = await this.resolveOpenHours(vendorId, dayStart.getDay());

    const conflicts = await this.db
      .select({
        scheduledAt: bookings.scheduledAt,
        durationMinutes: bookings.durationMinutes,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.vendorId, vendorId),
          query.staffId ? eq(bookings.staffId, query.staffId) : undefined,
          inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
        ),
      );

    const busyIntervals: BusyInterval[] = conflicts
      .filter((row) => row.scheduledAt >= dayStart && row.scheduledAt < dayEnd)
      .map((row) => {
        const startMinutes = minutesSinceMidnight(row.scheduledAt);
        return { startMinutes, endMinutes: startMinutes + row.durationMinutes };
      });

    const offsets = hours
      ? computeAvailableSlotOffsets(durationMinutes, busyIntervals, hours)
      : computeAvailableSlotOffsets(durationMinutes, busyIntervals);

    return {
      date: query.date,
      durationMinutes,
      slots: offsets.map((offset) =>
        dateFromOffset(query.date, offset).toISOString(),
      ),
    };
  }

  /** Null means the vendor hasn't configured hours for this weekday — `computeAvailableSlotOffsets` falls back to the platform default. */
  private async resolveOpenHours(
    vendorId: string,
    dayOfWeek: number,
  ): Promise<OpenHours | null> {
    const [configured] = await this.db
      .select({
        opensAtMinutes: businessHours.opensAtMinutes,
        closesAtMinutes: businessHours.closesAtMinutes,
      })
      .from(businessHours)
      .where(
        and(
          eq(businessHours.vendorId, vendorId),
          eq(businessHours.dayOfWeek, dayOfWeek),
        ),
      );

    return configured
      ? {
          startMinutes: configured.opensAtMinutes,
          endMinutes: configured.closesAtMinutes,
        }
      : null;
  }

  private async resolveDurationMinutes(
    vendorId: string,
    serviceIds?: string[],
  ): Promise<number> {
    if (!serviceIds || serviceIds.length === 0) {
      return 60; // sensible default when the customer hasn't picked services yet
    }

    const rows = await this.db
      .select({ durationMinutes: services.durationMinutes })
      .from(services)
      .where(
        and(eq(services.vendorId, vendorId), inArray(services.id, serviceIds)),
      );

    return rows.reduce((sum, row) => sum + row.durationMinutes, 0) || 60;
  }
}
