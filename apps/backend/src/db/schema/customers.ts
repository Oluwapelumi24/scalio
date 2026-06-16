import { pgTable, uuid, text, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';
import { users } from './users';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    // Links back to the platform identity when this client booked through the
    // app (PRD §6.1 "auto-created on first booking"). Null for walk-ins a
    // vendor enters manually with no app account.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    // Not required at sign-up, so this stays nullable until a vendor or the
    // customer fills it in.
    phone: text('phone'),
    email: text('email'),
    visitCount: integer('visit_count').notNull().default(0),
    lifetimeValueKobo: integer('lifetime_value_kobo').notNull().default(0),
    noShowCount: integer('no_show_count').notNull().default(0),
    lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Postgres treats NULLs as distinct in unique indexes, so these allow any
    // number of phone-less / user-less (walk-in) records per vendor while
    // still preventing the same phone or the same app user from getting two
    // CRM records at one vendor.
    unique('customers_vendor_phone_unique').on(table.vendorId, table.phone),
    unique('customers_vendor_user_unique').on(table.vendorId, table.userId),
  ],
);
