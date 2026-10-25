// Ads Manager campaign types, shared by the web pages and server actions.
// Mirrors the backend's /vendor-admin/ads endpoints.

export type AdObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'app_promotion' | 'sales';
export type AdDestination = 'whatsapp' | 'messenger' | 'instagram_direct' | 'website' | 'app';
export type AdPaymentRoute = 'scalio' | 'own_meta';
export type AdCampaignStatus = 'awaiting_payment' | 'launching' | 'in_review' | 'active' | 'paused' | 'completed' | 'rejected' | 'failed' | 'cancelled';

export interface AdLocation { key: string; type: 'city' | 'region' | 'country'; name: string; radiusKm?: number }
export interface AdTargeting {
  locations: AdLocation[];
  ageMin: number;
  ageMax: number;
  genders: 'all' | 'male' | 'female';
  interests: { id: string; name: string }[];
  placements: 'automatic' | { facebook: string[]; instagram: string[]; messenger: string[] };
}
export interface AdCreativeFields {
  mediaId: string;
  primaryText: string;
  headline: string;
  description: string | null;
  link: string | null;
  welcomeMessage: string | null;
  iceBreakers: string[];
}
export interface AdExtras { pixelId?: string; appId?: string; appStoreUrl?: string }

export interface AdObjectiveOption { id: AdObjective; label: string; blurb: string; bestFor: string; destinations: AdDestination[]; simple: boolean }
export interface AdRoutes {
  scalio: { available: boolean; reason: string | null };
  own_meta: { available: boolean; reason: string | null; adAccountName: string | null; paymentMethodLabel: string | null };
}

export interface AdBuilder {
  name: string;
  objective: AdObjective;
  destination: AdDestination;
  targeting: AdTargeting;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  days: number;
  bookingLink: string;
  pageName: string | null;
  instagramName: string | null;
  objectives: AdObjectiveOption[];
  fee: { percent: number; minKobo: number };
  creditKobo: number;
  routes: AdRoutes;
  aiAvailable: boolean;
}

export interface AdQuote {
  route: AdPaymentRoute;
  days: number;
  dailyBudgetKobo: number;
  spendKobo: number;
  vatKobo: number;
  feeKobo: number;
  creditUsedKobo: number;
  dueNowKobo: number;
  metaChargesKobo: number;
}

export interface AdCopyDraft {
  variants: { angle: string; primaryText: string; headline: string; description: string }[];
  welcomeMessage: string;
  iceBreakers: string[];
}

export interface InterestOption { id: string; name: string; audienceSize: number | null; topic: string | null }
export interface LocationOption { key: string; type: 'city' | 'region' | 'country'; name: string; label: string }

export interface AdCampaign {
  id: string;
  name: string;
  mode: 'simple' | 'advanced';
  objective: AdObjective;
  objectiveLabel: string;
  destination: AdDestination;
  route: AdPaymentRoute;
  status: AdCampaignStatus;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  days: number;
  paidSpendKobo: number;
  spentKobo: number;
  targeting: AdTargeting;
  creative: AdCreativeFields;
  mediaId: string | null;
  reviewNote: string | null;
  lastError: string | null;
  launchedAt: string | null;
  createdAt: string;
}

export interface AdCampaignDetail extends AdCampaign {
  payments: { id: string; purpose: 'launch' | 'extend'; extraDays: number | null; status: 'pending' | 'paid' | 'failed'; amountDueKobo: number; paidAt: string | null }[];
  quoteForExtension: Record<string, AdQuote>;
}

export interface NewAdCampaign {
  name: string;
  mode: 'simple' | 'advanced';
  objective: AdObjective;
  destination: AdDestination;
  route: AdPaymentRoute;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  targeting: AdTargeting;
  creative: AdCreativeFields;
  extras: AdExtras;
}

export interface AdCheckout { paid: boolean; authorizationUrl: string | null; quote: AdQuote; campaign: AdCampaign }


export const AD_STATUS: Record<AdCampaignStatus, { label: string; className: string }> = {
  awaiting_payment: { label: 'Waiting for payment', className: 'bg-amber-50 text-amber-700' },
  launching: { label: 'Sending to Meta', className: 'bg-indigo-50 text-indigo-700' },
  in_review: { label: 'In review', className: 'bg-indigo-50 text-indigo-700' },
  active: { label: 'Live', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'Paused', className: 'bg-slate-100 text-slate-600' },
  completed: { label: 'Finished', className: 'bg-slate-100 text-slate-600' },
  rejected: { label: 'Not approved', className: 'bg-red-50 text-red-700' },
  failed: { label: 'Needs attention', className: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
}

/** The journey of a paid ad, for the progress bar on the ad's page. */
export const AD_JOURNEY = ['Payment', 'Sent to Meta', 'In review', 'Live', 'Finished']

export function journeyIndex(status: AdCampaignStatus): number | null {
  switch (status) {
    case 'awaiting_payment': return 0
    case 'launching': return 1
    case 'in_review': return 2
    case 'active':
    case 'paused': return 3
    case 'completed': return 4
    default: return null
  }
}

export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`
export const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))
