import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { customers } from './customers';
import { staff, vendors } from './vendors';

// Phase 5: customer feedback. Each completed booking gets one private link
// (an unguessable token) the customer can use once to rate the visit.

export const feedbackRequests = pgTable(
  'feedback_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    bookingId: uuid('booking_id').notNull().unique().references(() => bookings.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    /** Who did the work — ratings feed this person's performance. */
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    token: text('token').notNull().unique(),
    /** When Scalio emailed the link (null: no email on file, or sending failed). */
    emailedAt: timestamp('emailed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    rating: integer('rating'),
    comment: text('comment'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    /** Set when someone at the business has dealt with a low rating. */
    followedUpAt: timestamp('followed_up_at', { withTimezone: true }),
    followedUpById: uuid('followed_up_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('feedback_requests_vendor_submitted_idx').on(t.vendorId, t.submittedAt)],
);
