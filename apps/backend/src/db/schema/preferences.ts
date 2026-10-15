import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

/** Per-module usage counter that lets frequently used home modules drift upward. */
export type ModuleUsage = Record<string, { count: number; lastUsedAt: string }>;

// One row per business. Interests and home layout belong to the business (not the
// device or the individual staff login) so mobile and web always agree.
export const businessPreferences = pgTable('business_preferences', {
  vendorId: uuid('vendor_id')
    .primaryKey()
    .references(() => vendors.id, { onDelete: 'cascade' }),
  interests: text('interests').array().notNull().default([]),
  pinnedModules: text('pinned_modules').array().notNull().default([]),
  hiddenModules: text('hidden_modules').array().notNull().default([]),
  moduleUsage: jsonb('module_usage').$type<ModuleUsage>().notNull().default({}),
  interestsCompletedAt: timestamp('interests_completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
