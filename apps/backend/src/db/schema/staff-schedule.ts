import { sql } from 'drizzle-orm';
import { date, index, integer, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { staff, vendors } from './vendors';

// A staff member's weekly working pattern. A staff member with no rows at all
// works whenever the business is open; once any day is set, days without a row
// are days off. 0 = Sunday … 6 = Saturday, like `business_hours`.
export const staffWorkingHours = pgTable(
  'staff_working_hours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startsAtMinutes: integer('starts_at_minutes').notNull(),
    endsAtMinutes: integer('ends_at_minutes').notNull(),
    breakStartsAtMinutes: integer('break_starts_at_minutes'),
    breakEndsAtMinutes: integer('break_ends_at_minutes'),
  },
  (table) => [unique('staff_working_hours_staff_day_unique').on(table.staffId, table.dayOfWeek)],
);

// Leave, sick days, holidays — inclusive date range in the business's calendar.
export const staffTimeOff = pgTable(
  'staff_time_off',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('staff_time_off_staff_idx').on(table.staffId, table.startDate)],
);

export const attendanceSourceValues = ['self', 'manager'] as const;

// One row per shift: clocked in, and (once finished) clocked out. Attendance
// metrics only appear for businesses that actually record these.
export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
    clockInAt: timestamp('clock_in_at', { withTimezone: true }).notNull(),
    clockOutAt: timestamp('clock_out_at', { withTimezone: true }),
    source: text('source', { enum: attendanceSourceValues }).notNull().default('self'),
    // Who pressed the button — the staff member, or a manager on their behalf.
    recordedById: uuid('recorded_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // At most one open shift per person, even if two devices tap at once.
    uniqueIndex('attendance_one_open_shift')
      .on(table.staffId)
      .where(sql`${table.clockOutAt} is null`),
    index('attendance_vendor_clock_in_idx').on(table.vendorId, table.clockInAt),
  ],
);
