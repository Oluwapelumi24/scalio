import type { AdTargeting } from '../db/schema';
import {
  OBJECTIVES, adSetParams, campaignParams, creativeParams, defaultSchedule, extendEnd, optimizationGoal, quote, runDays,
  statusFromMeta, toMetaTargeting, unspentCreditKobo, validateDraft, type CampaignDraft,
} from './campaign-rules';

const now = new Date('2026-10-17T10:00:00Z');
const fee = { percent: 10, minKobo: 100_000 };
const targeting: AdTargeting = {
  locations: [{ key: '2420605', type: 'city', name: 'Lagos', radiusKm: 10 }], ageMin: 18, ageMax: 45, genders: 'all',
  interests: [{ id: '6003', name: 'Hairstyling' }], placements: 'automatic',
};
const draft = (over: Partial<CampaignDraft> = {}): CampaignDraft => ({
  name: 'Amaka – chats', mode: 'simple', objective: 'engagement', destination: 'whatsapp', route: 'scalio',
  dailyBudgetKobo: 500_000, ...defaultSchedule(now), targeting,
  creative: { mediaId: 'm1', primaryText: 'Fresh braids this weekend!', headline: 'Book Amaka', description: null, link: null, welcomeMessage: 'Hi 👋', iceBreakers: ['Prices?'] },
  extras: {}, ...over,
});

describe('quote', () => {
  it('matches the plan’s example: ₦5,000 × 7 days, paid through Scalio', () => {
    expect(quote({ dailyBudgetKobo: 500_000, days: 7, route: 'scalio', fee })).toEqual({
      route: 'scalio', days: 7, dailyBudgetKobo: 500_000, spendKobo: 3_500_000, vatKobo: 262_500, feeKobo: 350_000,
      creditUsedKobo: 0, dueNowKobo: 4_112_500, metaChargesKobo: 0,
    });
  });

  it('charges only Scalio’s fee when Meta bills the vendor’s own card', () => {
    const q = quote({ dailyBudgetKobo: 500_000, days: 7, route: 'own_meta', fee, creditKobo: 999_999 });
    expect(q.dueNowKobo).toBe(350_000);
    expect(q.metaChargesKobo).toBe(3_762_500);
    expect(q.creditUsedKobo).toBe(0);
  });

  it('applies the minimum fee and uses ad credit up to the total', () => {
    expect(quote({ dailyBudgetKobo: 200_000, days: 3, route: 'scalio', fee }).feeKobo).toBe(100_000);
    const covered = quote({ dailyBudgetKobo: 200_000, days: 1, route: 'scalio', fee, creditKobo: 10_000_000 });
    expect(covered.dueNowKobo).toBe(0);
    expect(covered.creditUsedKobo).toBe(200_000 + 15_000 + 100_000);
  });
});

describe('schedule', () => {
  it('ends 7 days after it starts by default', () => {
    const s = defaultSchedule(now);
    expect(s.endAt.toISOString()).toBe('2026-10-24T10:00:00.000Z');
    expect(runDays(s.startAt, s.endAt)).toBe(7);
  });

  it('extends from the end date, or from now if the ad already ended', () => {
    expect(extendEnd(new Date('2026-10-24T10:00:00Z'), 7, now).toISOString()).toBe('2026-10-31T10:00:00.000Z');
    expect(extendEnd(new Date('2026-10-01T00:00:00Z'), 7, now).toISOString()).toBe('2026-10-24T10:00:00.000Z');
  });
});

describe('validateDraft', () => {
  it('accepts the simple-mode default', () => {
    expect(validateDraft(draft(), now)).toEqual([]);
  });

  it('keeps advanced goals out of simple mode and checks destinations', () => {
    expect(validateDraft(draft({ objective: 'sales', destination: 'website' }), now).join(' ')).toMatch(/advanced mode/);
    expect(validateDraft(draft({ mode: 'advanced', objective: 'traffic', destination: 'whatsapp' }), now).join(' ')).toMatch(/can’t send people/);
  });

  it('explains budget, schedule and creative problems in plain words', () => {
    const p = validateDraft(draft({ dailyBudgetKobo: 100_000, endAt: new Date('2027-03-01T00:00:00Z') }), now).join(' ');
    expect(p).toMatch(/at least ₦2,000/);
    expect(p).toMatch(/90 days/);
    expect(validateDraft(draft({ mode: 'advanced', objective: 'sales', destination: 'website' }), now).join(' ')).toMatch(/pixel/);
  });

  it('offers chat destinations for every Engagement ad', () => {
    expect(OBJECTIVES.engagement.destinations).toEqual(['whatsapp', 'instagram_direct', 'messenger']);
  });
});

describe('Meta mapping', () => {
  it('builds the click-to-WhatsApp ad set the plan describes', () => {
    const d = draft();
    const p = adSetParams(d, { pageId: 'p1', instagramUserId: 'ig1' }, 'c1', 3_500_000);
    expect(p).toMatchObject({
      campaign_id: 'c1', lifetime_budget: 3_500_000, optimization_goal: 'CONVERSATIONS', destination_type: 'WHATSAPP',
      billing_event: 'IMPRESSIONS', promoted_object: { page_id: 'p1' }, end_time: '2026-10-24T10:00:00.000Z',
    });
    expect(optimizationGoal('awareness', 'website')).toBe('REACH');
  });

  it('caps route-1 campaigns at what was paid and always creates them paused', () => {
    expect(campaignParams({ name: 'x', objective: 'engagement' }, 3_500_000)).toMatchObject({ objective: 'OUTCOME_ENGAGEMENT', status: 'PAUSED', spend_cap: 3_500_000, special_ad_categories: [] });
    expect(campaignParams({ name: 'x', objective: 'engagement' }, null)).not.toHaveProperty('spend_cap');
  });

  it('turns targeting into Meta’s spec', () => {
    expect(toMetaTargeting({ ...targeting, genders: 'female', placements: { facebook: ['feed'], instagram: ['stream', 'story'], messenger: [] } })).toEqual({
      geo_locations: { cities: [{ key: '2420605', radius: 10, distance_unit: 'kilometer' }] }, age_min: 18, age_max: 45, genders: [2],
      flexible_spec: [{ interests: [{ id: '6003', name: 'Hairstyling' }] }],
      publisher_platforms: ['facebook', 'instagram'], facebook_positions: ['feed'], instagram_positions: ['stream', 'story'],
    });
  });

  it('puts the welcome message and quick questions in chat ads', () => {
    const c = creativeParams(draft(), { pageId: 'p1', instagramUserId: null }, 'hash1', 'https://scalio.ng/book/amaka');
    const link = (c.object_story_spec as { link_data: Record<string, unknown> }).link_data;
    expect(link).toMatchObject({ image_hash: 'hash1', call_to_action: { type: 'WHATSAPP_MESSAGE' } });
    expect(JSON.parse(link.page_welcome_message as string).text_format.message.ice_breakers).toEqual([{ title: 'Prices?', response: '' }]);
  });
});

describe('after launch', () => {
  it('maps Meta statuses', () => {
    const later = new Date('2026-11-30T00:00:00Z');
    expect(statusFromMeta('PENDING_REVIEW', later, now)).toBe('in_review');
    expect(statusFromMeta('ACTIVE', later, now)).toBe('active');
    expect(statusFromMeta('DISAPPROVED', later, now)).toBe('rejected');
    expect(statusFromMeta('ACTIVE', new Date('2026-10-01'), now)).toBe('completed');
  });

  it('returns unspent budget with its VAT, never a negative amount', () => {
    expect(unspentCreditKobo(3_500_000, 3_000_000)).toBe(537_500);
    expect(unspentCreditKobo(3_500_000, 3_600_000)).toBe(0);
  });
});
