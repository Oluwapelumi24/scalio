import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { staff, vendors } from './vendors';

// Ads Manager (ADS_MANAGER_PLAN.md). Phase 1 stores who granted Scalio ad access
// and which Meta ad account each business advertises from.

/**
 * The long-lived Meta *user* token from the last Facebook login (~60 days).
 * Publishing uses Page tokens (social_connections); the Marketing API (ad
 * accounts, campaigns) needs the user token, so it's kept here, encrypted.
 */
export const metaUserAccess = pgTable(
  'meta_user_access',
  {
    vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
    metaUserId: text('meta_user_id').notNull(),
    tokenEnc: text('token_enc').notNull(),
    /** Null when Meta didn't say (tokens for app roles can be non-expiring). */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** Permissions the person actually granted — they can untick some in the login dialog. */
    grantedScopes: text('granted_scopes').array().notNull().default([]),
    connectedById: uuid('connected_by_id').references(() => staff.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('meta_user_access_meta_user_idx').on(t.metaUserId)],
);

/** 'vendor' = the business's own ad account and card (route 2); 'scalio' = Scalio-owned and funded (route 1, Phase 3). */
export const adAccountOwnerValues = ['vendor', 'scalio'] as const;
export const adAccountStatusValues = ['active', 'needs_reconnect'] as const;

/** The one ad account a business advertises from. */
export const adAccounts = pgTable('ad_accounts', {
  vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
  /** Meta's id with the `act_` prefix, e.g. act_1234567890. */
  metaAdAccountId: text('meta_ad_account_id').notNull(),
  name: text('name').notNull(),
  currency: text('currency').notNull(),
  timezone: text('timezone'),
  ownedBy: text('owned_by', { enum: adAccountOwnerValues }).notNull().default('vendor'),
  /** Meta's account_status: 1 active, 2 disabled, 3 unsettled, 7 pending review, 9 grace period, 101 closed… */
  metaStatus: integer('meta_status').notNull(),
  hasPaymentMethod: boolean('has_payment_method').notNull().default(false),
  /** What Meta shows for the payment method, e.g. "Visa *1234". Never the card number. */
  paymentMethodLabel: text('payment_method_label'),
  status: text('status', { enum: adAccountStatusValues }).notNull().default('active'),
  lastError: text('last_error'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
  chosenById: uuid('chosen_by_id').references(() => staff.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Every webhook Meta sends (messages, lead forms, …), stored as received once
 * the signature checks out. Phase 2 (inbox) processes them; storing first means
 * nothing is lost if processing fails, and Meta gets its 200 straight away.
 */
export const metaWebhookEvents = pgTable(
  'meta_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Top-level `object`: page, instagram, whatsapp_business_account, … */
    object: text('object').notNull(),
    payload: jsonb('payload').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [index('meta_webhook_events_unprocessed_idx').on(t.processedAt, t.receivedAt)],
);
