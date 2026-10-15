import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { staff, vendors } from './vendors';

// Phase 3 money model. Scalio never holds funds: customer payments settle to the
// vendor's own bank through their Paystack subaccount, and salaries are paid by
// the owner from their own bank. These tables record and reconcile that money.

/** Where Paystack settles a vendor's online payments. Account numbers are encrypted at rest. */
export const vendorPayoutAccounts = pgTable('vendor_payout_accounts', {
  vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
  bankCode: text('bank_code').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumberEnc: text('account_number_enc').notNull(),
  accountLast4: text('account_last4').notNull(),
  accountName: text('account_name').notNull(),
  paystackSubaccountCode: text('paystack_subaccount_code'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** A staff member's salary and the account the owner pays it into. */
export const staffPay = pgTable('staff_pay', {
  staffId: uuid('staff_id').primaryKey().references(() => staff.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  monthlySalaryKobo: integer('monthly_salary_kobo'),
  bankCode: text('bank_code'),
  bankName: text('bank_name'),
  accountNumberEnc: text('account_number_enc'),
  accountLast4: text('account_last4'),
  accountName: text('account_name'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** When salaries are due each month, and the window around pay day when they can be paid. */
export const payrollSchedules = pgTable('payroll_schedules', {
  vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
  payDay: integer('pay_day').notNull(), // 1–28, so every month has it
  opensDaysBefore: integer('opens_days_before').notNull().default(3),
  closesDaysAfter: integer('closes_days_after').notNull().default(5),
  paused: boolean('paused').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const salaryRunStatusValues = ['open', 'completed'] as const;

/** One payroll per business per month — the unique key stops a month being paid twice. */
export const salaryRuns = pgTable(
  'salary_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // 'YYYY-MM' of the pay day
    status: text('status', { enum: salaryRunStatusValues }).notNull().default('open'),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [unique('salary_runs_vendor_period_unique').on(t.vendorId, t.period)],
);

export const salaryPayoutStatusValues = ['pending', 'paid', 'skipped'] as const;

/** One line per staff member in a run, with the pay details as they were when the run started. */
export const salaryPayouts = pgTable(
  'salary_payouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id').notNull().references(() => salaryRuns.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    staffName: text('staff_name').notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    bankName: text('bank_name').notNull(),
    accountNumberEnc: text('account_number_enc').notNull(),
    accountLast4: text('account_last4').notNull(),
    accountName: text('account_name').notNull(),
    status: text('status', { enum: salaryPayoutStatusValues }).notNull().default('pending'),
    reference: text('reference'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    recordedById: uuid('recorded_by_id').references(() => staff.id, { onDelete: 'set null' }),
  },
  (t) => [unique('salary_payouts_run_staff_unique').on(t.runId, t.staffId)],
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    amountKobo: integer('amount_kobo').notNull(),
    category: text('category').notNull(),
    spentOn: date('spent_on').notNull(),
    note: text('note'),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
  },
  (t) => [index('expenses_vendor_spent_idx').on(t.vendorId, t.spentOn)],
);

export const ledgerKindValues = ['booking_payment', 'salary', 'expense', 'adjustment'] as const;

/**
 * The record of money in and out of the business. Append-only: corrections are
 * new entries. `dedupeKey` makes every write idempotent (a retried webhook or a
 * double tap records once).
 */
export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ledgerKindValues }).notNull(),
    direction: text('direction', { enum: ['in', 'out'] }).notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    description: text('description').notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    salaryPayoutId: uuid('salary_payout_id').references(() => salaryPayouts.id, { onDelete: 'set null' }),
    expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'set null' }),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('ledger_entries_vendor_dedupe_unique').on(t.vendorId, t.dedupeKey),
    index('ledger_entries_vendor_occurred_idx').on(t.vendorId, t.occurredAt),
  ],
);

/** Who changed what, for anything touching money or bank details. */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    actorStaffId: uuid('actor_staff_id').references(() => staff.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('audit_events_vendor_created_idx').on(t.vendorId, t.createdAt)],
);
