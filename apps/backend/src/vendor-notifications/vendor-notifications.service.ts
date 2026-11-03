import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq, gt, inArray, type SQL } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import {
  bookings,
  customers,
  services,
  staff,
  vendorNotifications,
  vendors,
  type VendorNotificationType,
} from '../db/schema';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';

type BookingRow = typeof bookings.$inferSelect;

export interface NewVendorNotification {
  vendorId: string;
  staffId?: string | null;
  type: VendorNotificationType;
  title: string;
  body: string;
  bookingId?: string | null;
  conversationId?: string | null;
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

/** "Tue 4 Nov, 2:30 pm" in the business's own timezone. */
export function formatWhen(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

/**
 * The business's notification feed. Writing one never throws: a failed
 * notification must not break the booking, payment or rating behind it.
 */
@Injectable()
export class VendorNotificationsService {
  private readonly logger = new Logger(VendorNotificationsService.name);

  constructor(@Inject(DB) private readonly db: Database) {}

  async notify(n: NewVendorNotification): Promise<void> {
    try {
      await this.db.insert(vendorNotifications).values({
        vendorId: n.vendorId,
        staffId: n.staffId ?? null,
        type: n.type,
        title: n.title,
        body: n.body,
        bookingId: n.bookingId ?? null,
        conversationId: n.conversationId ?? null,
      });
    } catch (err) {
      this.logger.warn(`Notification (${n.type}) for vendor ${n.vendorId} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** A notification about a booking, worded from the booking's client, services and time. */
  async notifyBooking(booking: BookingRow, type: 'booking_new' | 'booking_cancelled' | 'payment_received', amountKobo?: number): Promise<void> {
    try {
      const [ctx] = await this.db
        .select({ customerName: customers.name, timezone: vendors.timezone })
        .from(bookings)
        .innerJoin(customers, eq(customers.id, bookings.customerId))
        .innerJoin(vendors, eq(vendors.id, bookings.vendorId))
        .where(eq(bookings.id, booking.id));
      const serviceRows = booking.serviceIds.length
        ? await this.db.select({ name: services.name }).from(services).where(inArray(services.id, booking.serviceIds))
        : [];
      const who = ctx?.customerName ?? 'A client';
      const what = serviceRows.map((s) => s.name).join(', ') || 'an appointment';
      const when = formatWhen(booking.scheduledAt, ctx?.timezone ?? 'Africa/Lagos');

      const text = {
        booking_new: { title: 'New booking', body: `${who} booked ${what} for ${when}.` },
        booking_cancelled: { title: 'Booking cancelled', body: `${who} cancelled ${what} on ${when}.` },
        payment_received: { title: 'Payment received', body: `${who} paid ${naira(amountKobo ?? booking.amountPaidKobo)} for ${when}.` },
      }[type];

      await this.notify({ vendorId: booking.vendorId, staffId: booking.staffId, type, bookingId: booking.id, ...text });
    } catch (err) {
      this.logger.warn(`Booking notification (${type}) for ${booking.id} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Practitioners see what's about their own work; everyone else sees the whole business. */
  private scope(me: VendorPrincipal): SQL {
    const where = eq(vendorNotifications.vendorId, me.vendorId);
    if (me.role !== 'practitioner') return where;
    return and(where, eq(vendorNotifications.staffId, me.staffId))!;
  }

  private async readAt(me: VendorPrincipal): Promise<Date | null> {
    const [row] = await this.db.select({ at: staff.notificationsReadAt }).from(staff).where(eq(staff.id, me.staffId));
    return row?.at ?? null;
  }

  async unreadCount(me: VendorPrincipal): Promise<{ unread: number }> {
    const readAt = await this.readAt(me);
    const [row] = await this.db
      .select({ n: count() })
      .from(vendorNotifications)
      .where(readAt ? and(this.scope(me), gt(vendorNotifications.createdAt, readAt)) : this.scope(me));
    return { unread: Number(row?.n ?? 0) };
  }

  async list(me: VendorPrincipal, limit = 50) {
    const readAt = await this.readAt(me);
    const rows = await this.db
      .select()
      .from(vendorNotifications)
      .where(this.scope(me))
      .orderBy(desc(vendorNotifications.createdAt))
      .limit(Math.min(Math.max(limit, 1), 100));
    const items = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      bookingId: r.bookingId,
      conversationId: r.conversationId,
      createdAt: r.createdAt,
      unread: !readAt || r.createdAt > readAt,
    }));
    return { unread: items.filter((i) => i.unread).length, items };
  }

  async markAllRead(me: VendorPrincipal): Promise<{ ok: true }> {
    await this.db.update(staff).set({ notificationsReadAt: new Date() }).where(eq(staff.id, me.staffId));
    return { ok: true };
  }
}
