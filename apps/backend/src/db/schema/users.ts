import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// The platform-wide customer identity (PRD §4.1 step 7 / "customer master app").
// Distinct from `customers`, which is the per-vendor CRM record auto-created
// on first booking (PRD §6.1) — the same person is one `user` but a separate
// `customers` row in every vendor's client list.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  // Set by the mobile app once the user grants notification permission — lets
  // the backend push booking-status and reminder notifications via Expo's
  // push API. Null until registered, or if the user never grants permission.
  expoPushToken: text('expo_push_token'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
