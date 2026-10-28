import type { MetaGraph } from '../social/meta-graph';

// Marketing API calls for the campaign builder. Field names follow Graph v25;
// each call is a thin wrapper so the service code reads as the plan does.

export interface InterestOption {
  id: string;
  name: string;
  /** Rough audience size Meta reports (lower bound), or null. */
  audienceSize: number | null;
  topic: string | null;
}

export interface LocationOption {
  key: string;
  type: 'city' | 'region' | 'country';
  name: string;
  /** e.g. "Lagos, Nigeria". */
  label: string;
}

export interface ReachEstimate {
  lower: number;
  upper: number;
}

interface RawInterest {
  id: string;
  name: string;
  audience_size_lower_bound?: number;
  audience_size?: number;
  topic?: string;
}

const toInterest = (i: RawInterest): InterestOption => ({
  id: i.id, name: i.name, audienceSize: i.audience_size_lower_bound ?? i.audience_size ?? null, topic: i.topic ?? null,
});

export class MetaAdsApi {
  constructor(private readonly graph: MetaGraph) {}

  // ── Targeting search ───────────────────────────────────────────────────────

  async searchInterests(token: string, q: string): Promise<InterestOption[]> {
    const r = await this.graph.request<{ data?: RawInterest[] }>('GET', '/search', { type: 'adinterest', q, limit: 12, locale: 'en_GB' }, token);
    return (r.data ?? []).map(toInterest);
  }

  /** Interests related to ones already picked ("people who like hairstyling also like…"). */
  async suggestInterests(token: string, names: string[]): Promise<InterestOption[]> {
    if (names.length === 0) return [];
    const r = await this.graph.request<{ data?: RawInterest[] }>('GET', '/search', { type: 'adinterestsuggestion', interest_list: names, limit: 12 }, token);
    return (r.data ?? []).map(toInterest);
  }

  async searchLocations(token: string, q: string): Promise<LocationOption[]> {
    const r = await this.graph.request<{ data?: { key: string; type: string; name: string; region?: string; country_name?: string }[] }>(
      'GET', '/search', { type: 'adgeolocation', q, location_types: ['city', 'region', 'country'], limit: 10 }, token,
    );
    return (r.data ?? [])
      .filter((l) => l.type === 'city' || l.type === 'region' || l.type === 'country')
      .map((l) => ({
        key: l.key, type: l.type as LocationOption['type'], name: l.name,
        label: [l.name, l.type === 'city' ? l.region : null, l.type !== 'country' ? l.country_name : null].filter(Boolean).join(', '),
      }));
  }

  /** How many people the targeting could reach (monthly), for the audience-size meter. */
  async reachEstimate(adAccountId: string, token: string, targeting: Record<string, unknown>, optimizationGoal: string): Promise<ReachEstimate | null> {
    const r = await this.graph.request<{ data?: { estimate_mau_lower_bound?: number; estimate_mau_upper_bound?: number; estimate_ready?: boolean }[] }>(
      'GET', `/${adAccountId}/delivery_estimate`, { targeting_spec: targeting, optimization_goal: optimizationGoal }, token,
    );
    const d = r.data?.[0];
    if (!d || d.estimate_mau_lower_bound === undefined) return null;
    return { lower: d.estimate_mau_lower_bound, upper: d.estimate_mau_upper_bound ?? d.estimate_mau_lower_bound };
  }

  // ── Creating the campaign (always PAUSED until the last step) ──────────────

  async uploadImage(adAccountId: string, token: string, base64: string): Promise<string> {
    const r = await this.graph.request<{ images?: Record<string, { hash: string }> }>('POST', `/${adAccountId}/adimages`, { bytes: base64 }, token);
    const hash = Object.values(r.images ?? {})[0]?.hash;
    if (!hash) throw new Error('Meta didn’t return an image hash');
    return hash;
  }

  async create(adAccountId: string, token: string, edge: 'campaigns' | 'adsets' | 'adcreatives' | 'ads', params: Record<string, unknown>): Promise<string> {
    const r = await this.graph.request<{ id: string }>('POST', `/${adAccountId}/${edge}`, params, token);
    return r.id;
  }

  async update(objectId: string, token: string, params: Record<string, unknown>): Promise<void> {
    await this.graph.request('POST', `/${objectId}`, params, token);
  }

  // ── After launch ───────────────────────────────────────────────────────────

  async adStatus(adId: string, token: string): Promise<{ effectiveStatus: string; reviewNote: string | null }> {
    const r = await this.graph.request<{ effective_status: string; ad_review_feedback?: { global?: Record<string, string> } }>(
      'GET', `/${adId}`, { fields: 'effective_status,ad_review_feedback' }, token,
    );
    const feedback = r.ad_review_feedback?.global;
    return { effectiveStatus: r.effective_status, reviewNote: feedback ? Object.values(feedback).join(' ') : null };
  }

  /** Spend so far in the account's minor units (kobo for NGN accounts). */
  async campaignSpendKobo(campaignId: string, token: string): Promise<number> {
    const r = await this.graph.request<{ data?: { spend?: string }[] }>('GET', `/${campaignId}/insights`, { fields: 'spend', date_preset: 'maximum' }, token);
    const naira = Number(r.data?.[0]?.spend ?? 0);
    return Math.round((Number.isFinite(naira) ? naira : 0) * 100);
  }

  async adAccountCurrency(adAccountId: string, token: string): Promise<string> {
    const r = await this.graph.request<{ currency: string }>('GET', `/${adAccountId}`, { fields: 'currency' }, token);
    return r.currency;
  }

  // ── Route 1: Scalio's business advertising for the vendor's Page ──────────

  /** Asks the Page to let Scalio's business advertise for it; a Page admin approves it in Facebook. */
  async requestPageAccess(businessId: string, token: string, pageId: string): Promise<void> {
    await this.graph.request('POST', `/${businessId}/client_pages`, { page_id: pageId, permitted_tasks: ['ADVERTISE', 'ANALYZE'] }, token);
  }

  async hasPageAccess(businessId: string, token: string, pageId: string): Promise<boolean> {
    const r = await this.graph.request<{ data?: { id: string }[] }>('GET', `/${businessId}/client_pages`, { fields: 'id', limit: 200 }, token);
    return (r.data ?? []).some((p) => p.id === pageId);
  }
}
