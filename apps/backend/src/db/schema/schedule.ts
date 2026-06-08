import {
  pgTable,
  uuid,
  integer,
  text,
  date,
  unique,
} from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

// 0 = Sunday … 6 = Saturday, matching `Date#getDay()` so lookups need no translation.
export const businessHours = pgTable(
  'business_hours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    opensAtMinutes: integer('opens_at_minutes').notNull(),
    closesAtMinutes: integer('closes_at_minutes').notNull(),
  },
  (table) => [
    unique('business_hours_vendor_day_unique').on(
      table.vendorId,
      table.dayOfWeek,
    ),
  ],
);

// One-off closures (holidays, staff time off) that override the weekly hours
// for a specific date — checked before slot generation runs at all.
export const blackoutDates = pgTable(
  'blackout_dates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    reason: text('reason'),
  },
  (table) => [
    unique('blackout_dates_vendor_date_unique').on(table.vendorId, table.date),
  ],
);
