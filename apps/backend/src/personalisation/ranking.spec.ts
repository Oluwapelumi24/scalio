import { MODULES, type ModuleDef } from './catalog';
import { rankModules, usageScore, type RankingInput } from './ranking';

const now = new Date('2026-10-15T09:00:00Z');
const base: RankingInput = { interests: [], pinned: [], hidden: [], usage: {}, role: 'owner', now };
const ids = (defs: ModuleDef[]) => defs.map((d) => d.id);

describe('rankModules', () => {
  it('is deterministic: same input, same order', () => {
    const a = rankModules(MODULES, { ...base, interests: ['track_sales', 'run_ads'] });
    const b = rankModules(MODULES, { ...base, interests: ['track_sales', 'run_ads'] });
    expect(a).toEqual(b);
  });

  it('moves modules matching selected interests up their layer', () => {
    const plain = rankModules(MODULES, base).layers.overview;
    const finance = rankModules(MODULES, { ...base, interests: ['track_sales'] }).layers.overview;
    expect(ids(plain)[0]).toBe('today_bookings');
    expect(ids(finance)[0]).toBe('today_sales');
  });

  it('never removes a module just because no interest matched', () => {
    const ranked = rankModules(MODULES, { ...base, interests: ['run_ads'] });
    const shown = Object.values(ranked.layers).flat();
    expect(shown).toHaveLength(MODULES.length);
  });

  it('keeps attention modules visible even when hidden, and ignores interests for them', () => {
    const ranked = rankModules(MODULES, { ...base, hidden: ['awaiting_payment'], interests: ['run_ads'] });
    expect(ids(ranked.layers.attention)).toContain('awaiting_payment');
    expect(ids(ranked.hidden)).not.toContain('awaiting_payment');
  });

  it('moves hidden modules to the hidden list rather than dropping them', () => {
    const ranked = rankModules(MODULES, { ...base, hidden: ['team'] });
    expect(ids(ranked.layers.overview)).not.toContain('team');
    expect(ids(ranked.hidden)).toEqual(['team']);
  });

  it('puts pinned modules first in their layer', () => {
    const ranked = rankModules(MODULES, { ...base, pinned: ['business_hours'] });
    expect(ids(ranked.layers.quick_action)[0]).toBe('business_hours');
  });

  it('lets frequent use nudge a module up without beating an interest match', () => {
    const usage = { team: { count: 50, lastUsedAt: now.toISOString() } };
    const used = ids(rankModules(MODULES, { ...base, usage }).layers.overview);
    expect(used.indexOf('team')).toBeLessThan(ids(rankModules(MODULES, base).layers.overview).indexOf('team'));

    const withInterest = ids(rankModules(MODULES, { ...base, usage, interests: ['find_customers'] }).layers.overview);
    expect(withInterest.indexOf('new_customers')).toBeLessThan(withInterest.indexOf('team'));
  });

  it('removes modules the role is not permitted to see', () => {
    const ranked = rankModules(MODULES, { ...base, role: 'practitioner', pinned: ['today_sales'] });
    const shown = ids(Object.values(ranked.layers).flat());
    expect(shown).not.toContain('today_sales');
    expect(shown).not.toContain('manage_team');
    expect(shown).toContain('today_bookings');
  });
});

describe('usageScore', () => {
  it('halves every 14 days and is capped', () => {
    const fresh = usageScore({ count: 4, lastUsedAt: now.toISOString() }, now);
    const old = usageScore({ count: 4, lastUsedAt: new Date(now.getTime() - 14 * 86_400_000).toISOString() }, now);
    expect(fresh).toBe(4);
    expect(old).toBeCloseTo(2);
    expect(usageScore({ count: 1000, lastUsedAt: now.toISOString() }, now)).toBe(20);
    expect(usageScore(undefined, now)).toBe(0);
  });
});
