import type { AdCreative, AdDestination, AdObjective, AdObjectiveExtras, AdPaymentRoute, AdTargeting } from '../db/schema';

// The rules behind the campaign builder (ADS_MANAGER_PLAN.md §2b–2c, §3, §5):
// objectives and where they can send people, pricing, the schedule, and how a
// Scalio campaign maps onto Meta's fields. Pure, so it's all unit-tested.

// ── Objectives ──────────────────────────────────────────────────────────────

export interface ObjectiveInfo {
  id: AdObjective;
  meta: string;
  label: string;
  /** One line, for people who've never run an ad. */
  blurb: string;
  bestFor: string;
  destinations: AdDestination[];
  /** Advanced-only objectives aren't offered in simple mode. */
  simple: boolean;
}

export const OBJECTIVES: Record<AdObjective, ObjectiveInfo> = {
  engagement: {
    id: 'engagement', meta: 'OUTCOME_ENGAGEMENT', label: 'Get more chats', simple: true,
    blurb: 'People tap your ad and start a chat with you on WhatsApp, Instagram or Messenger.',
    bestFor: 'Bookings, questions and enquiries — best for most businesses.',
    destinations: ['whatsapp', 'instagram_direct', 'messenger'],
  },
  awareness: {
    id: 'awareness', meta: 'OUTCOME_AWARENESS', label: 'Be seen by more people', simple: false,
    blurb: 'Show your ad to as many people nearby as possible.',
    bestFor: 'A new shop, a new service or a special offer.',
    destinations: ['website'],
  },
  traffic: {
    id: 'traffic', meta: 'OUTCOME_TRAFFIC', label: 'Visits to your booking page', simple: false,
    blurb: 'Send people to your Scalio booking page or website.',
    bestFor: 'When people can book or buy online.',
    destinations: ['website'],
  },
  leads: {
    id: 'leads', meta: 'OUTCOME_LEADS', label: 'Collect enquiries', simple: false,
    blurb: 'Find people interested in your services and get them talking to you.',
    bestFor: 'Higher-priced services where people ask before booking.',
    destinations: ['whatsapp', 'messenger', 'instagram_direct'],
  },
  app_promotion: {
    id: 'app_promotion', meta: 'OUTCOME_APP_PROMOTION', label: 'Get app installs', simple: false,
    blurb: 'Get people to install your app.',
    bestFor: 'Businesses with their own app in the App Store or Google Play.',
    destinations: ['app'],
  },
  sales: {
    id: 'sales', meta: 'OUTCOME_SALES', label: 'Get more sales', simple: false,
    blurb: 'Find people likely to buy, on your website or in a chat.',
    bestFor: 'Selling products, packages or gift cards.',
    destinations: ['whatsapp', 'website'],
  },
};

export const DESTINATION_LABELS: Record<AdDestination, string> = {
  whatsapp: 'WhatsApp', instagram_direct: 'Instagram DM', messenger: 'Messenger', website: 'Booking page or website', app: 'Your app',
};

export const isChatDestination = (d: AdDestination) => d === 'whatsapp' || d === 'instagram_direct' || d === 'messenger';

// ── Money ───────────────────────────────────────────────────────────────────

export const VAT_RATE = 0.075;
/** Meta's practical floor in Nigeria is ~₦1,600–2,500/day; below ₦2,000 ads barely deliver. */
export const MIN_DAILY_BUDGET_KOBO = 200_000;
export const MAX_DAILY_BUDGET_KOBO = 50_000_000;
export const DEFAULT_DAILY_BUDGET_KOBO = 500_000;

export interface FeeSettings {
  /** Scalio's fee as a percent of ad spend. */
  percent: number;
  minKobo: number;
}

export interface Quote {
  route: AdPaymentRoute;
  days: number;
  dailyBudgetKobo: number;
  spendKobo: number;
  vatKobo: number;
  feeKobo: number;
  /** Ad credit applied (route 1 only). */
  creditUsedKobo: number;
  /** Paid to Scalio now, through Paystack. */
  dueNowKobo: number;
  /** Charged by Meta to the vendor's own card (route 2 only). */
  metaChargesKobo: number;
}

export function quote(input: { dailyBudgetKobo: number; days: number; route: AdPaymentRoute; fee: FeeSettings; creditKobo?: number }): Quote {
  const { dailyBudgetKobo, days, route, fee } = input;
  const spendKobo = dailyBudgetKobo * days;
  const vatKobo = Math.round(spendKobo * VAT_RATE);
  const feeKobo = Math.max(fee.minKobo, Math.round((spendKobo * fee.percent) / 100));
  if (route === 'own_meta') {
    return { route, days, dailyBudgetKobo, spendKobo, vatKobo, feeKobo, creditUsedKobo: 0, dueNowKobo: feeKobo, metaChargesKobo: spendKobo + vatKobo };
  }
  const gross = spendKobo + vatKobo + feeKobo;
  const creditUsedKobo = Math.min(Math.max(0, input.creditKobo ?? 0), gross);
  return { route, days, dailyBudgetKobo, spendKobo, vatKobo, feeKobo, creditUsedKobo, dueNowKobo: gross - creditUsedKobo, metaChargesKobo: 0 };
}

// ── Schedule ────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RUN_DAYS = 7;
export const MAX_RUN_DAYS = 90;
export const EXTEND_OPTIONS = [7, 14, 30] as const;

/** Every ad ends: 7 days after it starts unless the vendor picks longer. */
export function defaultSchedule(now: Date): { startAt: Date; endAt: Date; days: number } {
  return { startAt: now, endAt: new Date(now.getTime() + DEFAULT_RUN_DAYS * DAY_MS), days: DEFAULT_RUN_DAYS };
}

/** Whole days between start and end (a part day counts as a day of budget). */
export function runDays(startAt: Date, endAt: Date): number {
  return Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / DAY_MS));
}

export function extendEnd(endAt: Date, days: number, now: Date): Date {
  // An ad that already ended restarts its clock from now.
  const from = endAt.getTime() > now.getTime() ? endAt.getTime() : now.getTime();
  return new Date(from + days * DAY_MS);
}

// ── Validation ──────────────────────────────────────────────────────────────

export interface CampaignDraft {
  name: string;
  mode: 'simple' | 'advanced';
  objective: AdObjective;
  destination: AdDestination;
  route: AdPaymentRoute;
  dailyBudgetKobo: number;
  startAt: Date;
  endAt: Date;
  targeting: AdTargeting;
  creative: AdCreative;
  extras: AdObjectiveExtras;
}

/** Plain-language problems that stop a campaign being created. Empty when it's fine. */
export function validateDraft(d: CampaignDraft, now: Date): string[] {
  const p: string[] = [];
  const o = OBJECTIVES[d.objective];
  if (d.mode === 'simple' && !o.simple) p.push('Switch to advanced mode to use this goal.');
  if (!o.destinations.includes(d.destination)) p.push(`“${o.label}” ads can’t send people to ${DESTINATION_LABELS[d.destination]}.`);
  if (d.dailyBudgetKobo < MIN_DAILY_BUDGET_KOBO) p.push('The daily budget must be at least ₦2,000 — below that, Meta barely shows the ad.');
  if (d.dailyBudgetKobo > MAX_DAILY_BUDGET_KOBO) p.push('That daily budget is above Scalio’s limit of ₦500,000.');
  if (d.endAt.getTime() <= d.startAt.getTime()) p.push('The end date must be after the start date.');
  if (d.startAt.getTime() < now.getTime() - 60 * 60 * 1000) p.push('The start date is in the past.');
  if (runDays(d.startAt, d.endAt) > MAX_RUN_DAYS) p.push('Ads can run for up to 90 days at a time — extend it later if it’s working.');
  if (d.targeting.locations.length === 0) p.push('Choose at least one place to show the ad.');
  if (d.targeting.ageMin < 18 || d.targeting.ageMax > 65 || d.targeting.ageMin > d.targeting.ageMax) p.push('Ages must be between 18 and 65+.');
  if (!d.creative.primaryText.trim()) p.push('Add the text for your ad.');
  if (d.creative.primaryText.length > 2000) p.push('The ad text is too long.');
  if (!d.creative.headline.trim()) p.push('Add a headline.');
  if (!d.creative.mediaId) p.push('Add a photo for your ad.');
  if ((d.destination === 'website') && !/^https:\/\//.test(d.creative.link ?? '')) p.push('Add the https:// link people should visit.');
  if (d.destination === 'app' && (!d.extras.appId || !/^https:\/\//.test(d.extras.appStoreUrl ?? ''))) p.push('Add your app’s Meta app id and its store link.');
  if (d.objective === 'sales' && d.destination === 'website' && !d.extras.pixelId) p.push('Sales to a website need your Meta pixel id.');
  if (isChatDestination(d.destination) && d.creative.iceBreakers.length > 4) p.push('Use up to 4 quick questions.');
  return p;
}

// ── Mapping to Meta ─────────────────────────────────────────────────────────
// Field names follow the Marketing API (Graph v25). Confirm each objective /
// destination pair against a live test ad account before launch.

const DESTINATION_TYPE: Partial<Record<AdDestination, string>> = {
  whatsapp: 'WHATSAPP', messenger: 'MESSENGER', instagram_direct: 'INSTAGRAM_DIRECT', website: 'WEBSITE', app: 'APP',
};

const CALL_TO_ACTION: Record<AdDestination, string> = {
  whatsapp: 'WHATSAPP_MESSAGE', messenger: 'MESSAGE_PAGE', instagram_direct: 'INSTAGRAM_MESSAGE', website: 'BOOK_NOW', app: 'INSTALL_MOBILE_APP',
};

export function optimizationGoal(objective: AdObjective, destination: AdDestination): string {
  if (isChatDestination(destination)) return 'CONVERSATIONS';
  switch (objective) {
    case 'awareness': return 'REACH';
    case 'traffic': return 'LINK_CLICKS';
    case 'app_promotion': return 'APP_INSTALLS';
    case 'sales': return 'OFFSITE_CONVERSIONS';
    default: return 'LINK_CLICKS';
  }
}

export function toMetaTargeting(t: AdTargeting): Record<string, unknown> {
  const cities = t.locations.filter((l) => l.type === 'city').map((l) => ({ key: l.key, ...(l.radiusKm ? { radius: l.radiusKm, distance_unit: 'kilometer' } : {}) }));
  const regions = t.locations.filter((l) => l.type === 'region').map((l) => ({ key: l.key }));
  const countries = t.locations.filter((l) => l.type === 'country').map((l) => l.key);
  const geo: Record<string, unknown> = {};
  if (cities.length) geo.cities = cities;
  if (regions.length) geo.regions = regions;
  if (countries.length) geo.countries = countries;
  const spec: Record<string, unknown> = { geo_locations: geo, age_min: t.ageMin, age_max: t.ageMax };
  if (t.genders !== 'all') spec.genders = [t.genders === 'male' ? 1 : 2];
  if (t.interests.length) spec.flexible_spec = [{ interests: t.interests.map((i) => ({ id: i.id, name: i.name })) }];
  if (t.placements !== 'automatic') {
    const platforms = (['facebook', 'instagram', 'messenger'] as const).filter((p) => (t.placements as Record<string, string[]>)[p].length > 0);
    spec.publisher_platforms = platforms;
    if (t.placements.facebook.length) spec.facebook_positions = t.placements.facebook;
    if (t.placements.instagram.length) spec.instagram_positions = t.placements.instagram;
    if (t.placements.messenger.length) spec.messenger_positions = t.placements.messenger;
  }
  return spec;
}

export interface MetaIds {
  pageId: string;
  instagramUserId: string | null;
  whatsappNumber?: string | null;
}

/** Campaign-level fields. Budgets live on the ad set; route 1 also caps spend on the campaign. */
export function campaignParams(c: { name: string; objective: AdObjective }, spendCapKobo: number | null): Record<string, unknown> {
  return {
    name: c.name,
    objective: OBJECTIVES[c.objective].meta,
    special_ad_categories: [],
    buying_type: 'AUCTION',
    status: 'PAUSED',
    is_adset_budget_sharing_enabled: false,
    ...(spendCapKobo !== null ? { spend_cap: spendCapKobo } : {}),
  };
}

export function adSetParams(
  c: { name: string; objective: AdObjective; destination: AdDestination; targeting: AdTargeting; extras: AdObjectiveExtras; startAt: Date; endAt: Date },
  ids: MetaIds,
  campaignId: string,
  lifetimeBudgetKobo: number,
): Record<string, unknown> {
  const promoted: Record<string, unknown> = { page_id: ids.pageId };
  if (c.destination === 'whatsapp' && ids.whatsappNumber) promoted.whatsapp_phone_number = ids.whatsappNumber;
  if (c.destination === 'app') {
    delete promoted.page_id;
    promoted.application_id = c.extras.appId;
    promoted.object_store_url = c.extras.appStoreUrl;
  }
  if (c.objective === 'sales' && c.destination === 'website') {
    delete promoted.page_id;
    promoted.pixel_id = c.extras.pixelId;
    promoted.custom_event_type = 'PURCHASE';
  }
  const params: Record<string, unknown> = {
    name: `${c.name} – audience`,
    campaign_id: campaignId,
    // Meta takes NGN budgets in kobo (minor units, offset 100) — the same unit Scalio stores.
    lifetime_budget: lifetimeBudgetKobo,
    start_time: c.startAt.toISOString(),
    end_time: c.endAt.toISOString(),
    billing_event: 'IMPRESSIONS',
    optimization_goal: optimizationGoal(c.objective, c.destination),
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    targeting: toMetaTargeting(c.targeting),
    status: 'ACTIVE',
  };
  if (c.objective !== 'awareness') params.promoted_object = promoted;
  const destinationType = DESTINATION_TYPE[c.destination];
  if (destinationType && c.objective !== 'awareness' && c.destination !== 'app') params.destination_type = destinationType;
  return params;
}

/** The welcome message Meta shows when a chat ad opens: a greeting plus tap-to-ask questions. */
export function welcomeMessageSpec(text: string, iceBreakers: string[]): string {
  return JSON.stringify({
    type: 'VISUAL_EDITOR',
    version: 2,
    landing_screen_type: 'welcome_message',
    media_type: 'text',
    text_format: {
      customer_action_type: iceBreakers.length ? 'ice_breakers' : 'autofill_message',
      message: {
        text,
        ...(iceBreakers.length ? { ice_breakers: iceBreakers.map((title) => ({ title, response: '' })) } : { autofill_message: { content: 'Hi! I’d like to know more.' } }),
      },
    },
    user_edit: false,
    surface: 'visual_editor_new',
  });
}

export function creativeParams(
  c: { name: string; destination: AdDestination; creative: AdCreative; extras: AdObjectiveExtras },
  ids: MetaIds,
  imageHash: string,
  bookingLink: string,
): Record<string, unknown> {
  const chat = isChatDestination(c.destination);
  const link = c.destination === 'app' ? c.extras.appStoreUrl! : chat ? (c.destination === 'whatsapp' ? 'https://api.whatsapp.com/send' : `https://www.facebook.com/${ids.pageId}`) : (c.creative.link ?? bookingLink);
  const linkData: Record<string, unknown> = {
    image_hash: imageHash,
    link,
    message: c.creative.primaryText,
    name: c.creative.headline,
    call_to_action: { type: CALL_TO_ACTION[c.destination], value: c.destination === 'app' ? { link, application: c.extras.appId } : chat ? { app_destination: DESTINATION_TYPE[c.destination] } : { link } },
  };
  if (c.creative.description) linkData.description = c.creative.description;
  if (chat && c.creative.welcomeMessage) linkData.page_welcome_message = welcomeMessageSpec(c.creative.welcomeMessage, c.creative.iceBreakers);
  return {
    name: `${c.name} – creative`,
    object_story_spec: { page_id: ids.pageId, ...(ids.instagramUserId ? { instagram_user_id: ids.instagramUserId } : {}), link_data: linkData },
  };
}

// ── Meta status → Scalio status ─────────────────────────────────────────────

export function statusFromMeta(effectiveStatus: string, endAt: Date, now: Date): 'in_review' | 'active' | 'paused' | 'completed' | 'rejected' {
  if (effectiveStatus === 'DISAPPROVED') return 'rejected';
  if (endAt.getTime() <= now.getTime()) return 'completed';
  if (['PENDING_REVIEW', 'IN_PROCESS', 'PREAPPROVED', 'PENDING_BILLING_INFO'].includes(effectiveStatus)) return 'in_review';
  if (['PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED'].includes(effectiveStatus)) return 'paused';
  return 'active';
}

/**
 * Route 1: budget paid for but not spent comes back as ad credit, with the VAT
 * collected on it (Meta only charges VAT on what it spends). Scalio's fee stays.
 */
export function unspentCreditKobo(paidSpendKobo: number, spentKobo: number): number {
  const unspent = Math.max(0, paidSpendKobo - spentKobo);
  return unspent + Math.round(unspent * VAT_RATE);
}
