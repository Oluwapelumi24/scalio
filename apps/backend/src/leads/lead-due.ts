import { sql, type SQL } from 'drizzle-orm';
import { leads } from '../db/schema';

/** A new lead nobody has touched for this long needs a follow-up, even without a date set. */
export const UNTOUCHED_LEAD_MS = 24 * 60 * 60_000;

/**
 * An open lead is due when its follow-up time has come, or when it's still `new`
 * with no follow-up planned a day after it came in. Used by the leads list and
 * the home screen alert, so the two always agree.
 */
export function leadDueCondition(now: Date): SQL {
  const untouchedSince = new Date(now.getTime() - UNTOUCHED_LEAD_MS);
  return sql`${leads.status} in ('new', 'contacted') and (
    ${leads.followUpAt} <= ${now}
    or (${leads.status} = 'new' and ${leads.followUpAt} is null and ${leads.createdAt} <= ${untouchedSince})
  )`;
}

/** The same rule as `leadDueCondition`, for a lead already loaded. */
export function isLeadDue(lead: { status: string; followUpAt: Date | null; createdAt: Date }, now: Date): boolean {
  if (lead.status !== 'new' && lead.status !== 'contacted') return false;
  if (lead.followUpAt) return lead.followUpAt <= now;
  return lead.status === 'new' && now.getTime() - lead.createdAt.getTime() >= UNTOUCHED_LEAD_MS;
}
