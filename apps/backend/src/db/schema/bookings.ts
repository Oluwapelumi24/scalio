import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { vendors, staff, paymentModeValues } from './vendors';
import { customers } from './customers';

export const bookingStatusValues = [
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled_by_customer',
  'cancelled_by_vendor',
  'no_show',
] as const;

// Statuses that occupy a slot. Anything outside this set has released it.
export const ACTIVE_BOOKING_STATUSES = ['pending_payment', 'confirmed'] as const;

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    serviceIds: uuid('service_ids').array().notNull(),
    status: text('status', { enum: bookingStatusValues }).notNull().default('pending_payment'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    paymentMode: text('payment_mode', { enum: paymentModeValues }).notNull(),
    amountDueKobo: integer('amount_due_kobo').notNull(),
    amountPaidKobo: integer('amount_paid_kobo').notNull().default(0),
    cancellationReason: text('cancellation_reason'),
    // Token of the Redis slot lock held while this booking is active — lets
    // us safely compare-and-delete the lock from any later request, without
    // ever clobbering a different lock someone else has since acquired.
    lockToken: text('lock_token'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Postgres-level backstop for the Redis slot lock (PRD §9.3 step 5):
    // even if Redis is unavailable, two active bookings can't occupy the
    // same staff member's slot at the same vendor.
    uniqueIndex('bookings_active_slot_unique')
      .on(table.vendorId, table.staffId, table.scheduledAt)
      .where(sql`${table.status} in ('pending_payment', 'confirmed')`),
  ],
);
