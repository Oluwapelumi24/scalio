import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { bookings } from '../db/schema';
import { PushService } from './push.service';

const REMINDER_WINDOW_MINUTES = 60;

function formatScheduledAt(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

@Injectable()
export class BookingRemindersService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly push: PushService,
  ) {}

  /**
   * Nudges customers shortly before their appointment. Runs every 5 minutes
   * and looks ~1 hour ahead, so each confirmed booking that falls into that
   * window gets exactly one reminder (`reminderSentAt` guards against repeats
   * across runs and concurrent instances).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendUpcomingReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + REMINDER_WINDOW_MINUTES * 60_000,
    );

    const due = await this.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          isNull(bookings.reminderSentAt),
          gte(bookings.scheduledAt, now),
          lte(bookings.scheduledAt, windowEnd),
        ),
      );

    for (const booking of due) {
      const [claimed] = await this.db
        .update(bookings)
        .set({ reminderSentAt: new Date() })
        .where(
          and(eq(bookings.id, booking.id), isNull(bookings.reminderSentAt)),
        )
        .returning({ id: bookings.id });

      // Lost the race to another instance — they'll send it.
      if (!claimed) continue;

      await this.push.notifyCustomer(booking.customerId, {
        title: 'Upcoming appointment',
        body: `Your appointment is coming up at ${formatScheduledAt(booking.scheduledAt)}.`,
      });
    }
  }
}
