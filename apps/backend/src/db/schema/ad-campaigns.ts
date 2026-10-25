import { index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { contentMedia } from './growth';
import { staff, vendors } from './vendors';

// Ads Manager Phase 3 (ADS_MANAGER_PLAN.md §2b–2c, §4): campaigns, what was
// paid for them, and ad credit from unspent budget. Money is in kobo.

export const adObjectiveValues = ['awareness', 'traffic', 'engagement', 'leads', 'app_promotion', 'sales'] as const;
export type AdObjective = (typeof adObjectiveValues)[number];

/** Where people go when they tap the ad. */
export const adDestinationValues = ['whatsapp', 'messenger', 'instagram_direct', 'website', 'app'] as const;
export type AdDestination = (typeof adDestinationValues)[number];

/** 'scalio' = vendor pays Scalio, ad runs on Scalio's ad account (route 1); 'own_meta' = vendor's ad account and card (route 2). */
export const adPaymentRouteValues = ['scalio', 'own_meta'] as const;
export type AdPaymentRoute = (typeof adPaymentRouteValues)[number];

export const adCampaignStatusValues = [
  'awaiting_payment', // created, not paid yet
  'launching', // paid; creating it on Meta
  'in_review', // on Meta, waiting for Meta's ad review
  'active',
  'paused',
  'completed',
  'rejected', // Meta didn't approve the ad
  'failed', // paid, but creating it on Meta failed — retry from the app
  'cancelled',
] as const;
export type AdCampaignStatus = (typeof adCampaignStatusValues)[number];

export interface AdLocation {
  /** Meta geolocation key (city or region). */
  key: string;
  type: 'city' | 'region' | 'country';
  name: string;
  /** Cities only: reach people this many km around the city. */
  radiusKm?: number;
}

export interface AdTargeting {
  locations: AdLocation[];
  ageMin: number;
  ageMax: number;
  genders: 'all' | 'male' | 'female';
  interests: { id: string; name: string }[];
  /** 'automatic' = Advantage+ placements (recommended). */
  placements: 'automatic' | { facebook: string[]; instagram: string[]; messenger: string[] };
}

export interface AdCreative {
  mediaId: string;
  primaryText: string;
  headline: string;
  description: string | null;
  /** For website / app destinations. */
  link: string | null;
  /** Chat ads: the first message people see, and up to 3 tap-to-ask questions. */
  welcomeMessage: string | null;
  iceBreakers: string[];
}

export interface AdObjectiveExtras {
  /** Sales to a website: the Meta pixel. */
  pixelId?: string;
  /** App promotion. */
  appId?: string;
  appStoreUrl?: string;
}

export const adCampaigns = pgTable(
  'ad_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mode: text('mode', { enum: ['simple', 'advanced'] }).notNull(),
    objective: text('objective', { enum: adObjectiveValues }).notNull(),
    destination: text('destination', { enum: adDestinationValues }).notNull(),
    route: text('route', { enum: adPaymentRouteValues }).notNull(),
    status: text('status', { enum: adCampaignStatusValues }).notNull().default('awaiting_payment'),
    dailyBudgetKobo: integer('daily_budget_kobo').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    /** Ad spend paid for so far (launch + extensions) — the Meta lifetime budget and spend cap. */
    paidSpendKobo: integer('paid_spend_kobo').notNull().default(0),
    targeting: jsonb('targeting').$type<AdTargeting>().notNull(),
    creative: jsonb('creative').$type<AdCreative>().notNull(),
    extras: jsonb('extras').$type<AdObjectiveExtras>().notNull().default({}),
    mediaId: uuid('media_id').references(() => contentMedia.id, { onDelete: 'set null' }),
    /** The Meta ad account it runs on (`act_…`), fixed at launch. */
    metaAdAccountId: text('meta_ad_account_id'),
    metaCampaignId: text('meta_campaign_id'),
    metaAdSetId: text('meta_ad_set_id'),
    metaCreativeId: text('meta_creative_id'),
    metaAdId: text('meta_ad_id'),
    /** Meta's own status and review note, as last synced. */
    metaStatus: text('meta_status'),
    reviewNote: text('review_note'),
    /** What Meta reports as spent, last synced. */
    spentKobo: integer('spent_kobo').notNull().default(0),
    lastError: text('last_error'),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    launchedAt: timestamp('launched_at', { withTimezone: true }),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('ad_campaigns_vendor_idx').on(t.vendorId, t.createdAt), index('ad_campaigns_status_idx').on(t.status)],
);

export const adPaymentPurposeValues = ['launch', 'extend'] as const;
export const adPaymentStatusValues = ['pending', 'paid', 'failed'] as const;

/** Each Paystack payment for a campaign: launching it, or extending it. */
export const adPayments = pgTable(
  'ad_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
    purpose: text('purpose', { enum: adPaymentPurposeValues }).notNull(),
    /** Extensions: days added. */
    extraDays: integer('extra_days'),
    route: text('route', { enum: adPaymentRouteValues }).notNull(),
    /** Ad spend this payment covers (0 for own_meta: Meta charges the vendor's card). */
    spendKobo: integer('spend_kobo').notNull(),
    vatKobo: integer('vat_kobo').notNull(),
    feeKobo: integer('fee_kobo').notNull(),
    creditUsedKobo: integer('credit_used_kobo').notNull().default(0),
    /** What the vendor pays through Paystack. */
    amountDueKobo: integer('amount_due_kobo').notNull(),
    /** Paystack reference, `ads_<payment id>`. */
    reference: text('reference').notNull().unique(),
    status: text('status', { enum: adPaymentStatusValues }).notNull().default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('ad_payments_campaign_idx').on(t.campaignId)],
);

export const adCreditReasonValues = ['unspent_budget', 'used_for_payment', 'cancelled_before_launch', 'adjustment'] as const;

/** Ad credit (route 1): unspent budget comes back here and pays for the next ad. Balance = sum. */
export const adCreditEntries = pgTable(
  'ad_credit_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => adCampaigns.id, { onDelete: 'set null' }),
    /** Positive adds credit, negative uses it. */
    amountKobo: integer('amount_kobo').notNull(),
    reason: text('reason', { enum: adCreditReasonValues }).notNull(),
    /** Makes each credit or use happen once, however often a sync or webhook repeats. */
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('ad_credit_entries_dedupe_unique').on(t.dedupeKey), index('ad_credit_entries_vendor_idx').on(t.vendorId)],
);

/** Route 1: whether the vendor's Facebook Page has let Scalio's business advertise for it. */
export const scalioPageAccess = pgTable('scalio_page_access', {
  vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull(),
  status: text('status', { enum: ['requested', 'approved'] }).notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
});
