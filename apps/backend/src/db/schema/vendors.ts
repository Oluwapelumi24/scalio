import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  businessName: text('business_name').notNull(),
  category: text('category').notNull(),
  logoUrl: text('logo_url'),
  themeColor: text('theme_color'),
  averageDaysBetweenVisits: integer('average_days_between_visits'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const staffRoleValues = ['owner', 'manager', 'practitioner', 'front_desk'] as const;

export const staff = pgTable('staff', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: text('role', { enum: staffRoleValues }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentModeValues = ['pay_on_arrival', 'deposit', 'full_prepayment'] as const;

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceKobo: integer('price_kobo').notNull(),
  paymentMode: text('payment_mode', { enum: paymentModeValues }).notNull().default('pay_on_arrival'),
  depositPercent: integer('deposit_percent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
