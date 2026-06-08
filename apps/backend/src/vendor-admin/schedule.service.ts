import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { businessHours, blackoutDates } from '../db/schema';
import type { SetBusinessHoursDto } from './dto/set-business-hours.dto';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';

@Injectable()
export class VendorScheduleService {
  constructor(@Inject(DB) private readonly db: Database) {}

  getBusinessHours(vendorId: string) {
    return this.db
      .select()
      .from(businessHours)
      .where(eq(businessHours.vendorId, vendorId));
  }

  /** Replaces the vendor's whole weekly schedule in one atomic swap — at most one entry per weekday. */
  async setBusinessHours(vendorId: string, dto: SetBusinessHoursDto) {
    const days = new Set(dto.days.map((entry) => entry.dayOfWeek));
    if (days.size !== dto.days.length) {
      throw new ConflictException(
        'Each weekday can only have one set of hours.',
      );
    }
    for (const entry of dto.days) {
      if (entry.opensAtMinutes >= entry.closesAtMinutes) {
        throw new ConflictException(
          'Opening time must be before closing time.',
        );
      }
    }

    return this.db.transaction(async (tx) => {
      await tx
        .delete(businessHours)
        .where(eq(businessHours.vendorId, vendorId));
      if (dto.days.length === 0) {
        return [];
      }
      return tx
        .insert(businessHours)
        .values(
          dto.days.map((entry) => ({
            vendorId,
            dayOfWeek: entry.dayOfWeek,
            opensAtMinutes: entry.opensAtMinutes,
            closesAtMinutes: entry.closesAtMinutes,
          })),
        )
        .returning();
    });
  }

  getBlackoutDates(vendorId: string) {
    return this.db
      .select()
      .from(blackoutDates)
      .where(eq(blackoutDates.vendorId, vendorId));
  }

  async addBlackoutDate(vendorId: string, dto: CreateBlackoutDateDto) {
    const [existing] = await this.db
      .select({ id: blackoutDates.id })
      .from(blackoutDates)
      .where(
        and(
          eq(blackoutDates.vendorId, vendorId),
          eq(blackoutDates.date, dto.date),
        ),
      );
    if (existing) {
      throw new ConflictException(`${dto.date} is already blocked off.`);
    }

    const [created] = await this.db
      .insert(blackoutDates)
      .values({ vendorId, date: dto.date, reason: dto.reason })
      .returning();
    return created;
  }

  async removeBlackoutDate(vendorId: string, blackoutDateId: string) {
    const [deleted] = await this.db
      .delete(blackoutDates)
      .where(
        and(
          eq(blackoutDates.id, blackoutDateId),
          eq(blackoutDates.vendorId, vendorId),
        ),
      )
      .returning({ id: blackoutDates.id });
    if (!deleted) {
      throw new NotFoundException(`Blackout date ${blackoutDateId} not found`);
    }
  }
}
