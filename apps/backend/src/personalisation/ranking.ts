import type { ModuleUsage } from '../db/schema';
import type { HomeLayer, ModuleDef } from './catalog';

export interface RankingInput {
  interests: readonly string[];
  pinned: readonly string[];
  hidden: readonly string[];
  usage: ModuleUsage;
  role: string;
  now: Date;
}

export interface RankedHome {
  layers: Record<HomeLayer, ModuleDef[]>;
  /** Modules the user hid — still reachable from "Customise home" and the navigation. */
  hidden: ModuleDef[];
}

const INTEREST_WEIGHT = 30;
const PIN_WEIGHT = 1000;
const USAGE_CAP = 20;
const USAGE_HALF_LIFE_DAYS = 14;

/** Recent use counts more than old use; capped so habits nudge rather than dominate. */
export function usageScore(usage: ModuleUsage[string] | undefined, now: Date): number {
  if (!usage) return 0;
  const days = Math.max(0, (now.getTime() - new Date(usage.lastUsedAt).getTime()) / 86_400_000);
  return Math.min(USAGE_CAP, usage.count * 0.5 ** (days / USAGE_HALF_LIFE_DAYS));
}

export function scoreModule(def: ModuleDef, input: RankingInput): number {
  const interestMatches = def.interests.filter((i) => input.interests.includes(i)).length;
  return (
    def.basePriority +
    interestMatches * INTEREST_WEIGHT +
    usageScore(input.usage[def.id], input.now) +
    (input.pinned.includes(def.id) ? PIN_WEIGHT : 0)
  );
}

/**
 * Orders the candidate modules for one business and role.
 *
 * Rules (PLATFORM_PLAN.md §3):
 * - role permissions remove a module entirely; preferences never do;
 * - attention modules ignore interests, pins and hides — an alert is always shown;
 * - hidden modules move to `hidden` rather than disappearing;
 * - ties fall back to registry order, so the result is deterministic.
 */
export function rankModules(candidates: readonly ModuleDef[], input: RankingInput): RankedHome {
  const layers: RankedHome['layers'] = {
    attention: [],
    overview: [],
    quick_action: [],
    recommendation: [],
  };
  const hidden: ModuleDef[] = [];

  const permitted = candidates
    .map((def, index) => ({ def, index }))
    .filter(({ def }) => !def.roles || def.roles.includes(input.role as never));

  const scored = permitted.map(({ def, index }) => ({
    def,
    index,
    score: def.layer === 'attention' ? def.basePriority : scoreModule(def, input),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  for (const { def } of scored) {
    if (def.layer !== 'attention' && input.hidden.includes(def.id)) hidden.push(def);
    else layers[def.layer].push(def);
  }
  return { layers, hidden };
}
