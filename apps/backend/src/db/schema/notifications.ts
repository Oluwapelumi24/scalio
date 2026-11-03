import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { conversations } from './inbox';
import { staff, vendors } from './vendors';

// The bell on the vendor app's home screen: things that happened without the
// business doing them (a client booked, cancelled, paid, rated, or a chat
// needs a person).

export const vendorNotificationTypeValues = [
  'booking_new',
  'booking_cancelled',
  'payment_received',
  'review',
  'inbox_handoff',
] as const;
export type VendorNotificationType = (typeof vendorNotificationTypeValues)[number];

export const vendorNotifications = pgTable(
  'vendor_notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    /** The staff member it's about (practitioners only see their own); null = the whole business. */
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    type: text('type', { enum: vendorNotificationTypeValues }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('vendor_notifications_vendor_created_idx').on(t.vendorId, t.createdAt)],
);
