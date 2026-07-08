import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Pre-launch interest capture for the marketing site — distinct from `users`
// (real customer accounts) and `staff`/`vendors` (real, approved vendor
// accounts). A waitlist row never becomes either automatically.
export const waitlistSignups = pgTable('waitlist_signups', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  audience: text('audience', { enum: ['customer', 'vendor'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
