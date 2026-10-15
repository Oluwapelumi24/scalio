import type { ModuleUsage } from '../db/schema';
import { MODULES, type HomeLayer, type ModuleDef } from './catalog';
import { rankModules } from './ranking';

export interface UpcomingBooking {
  id: string;
  scheduledAt: string;
  status: string;
  customerName: string | null;
}

/** Real figures for one business (and, for practitioners, one staff member). */
export interface HomeSnapshot {
  bookingLink: string;
  todayBookings: number;
  todaySalesKobo: number;
  sales30dKobo: number;
  upcoming: UpcomingBooking[];
  totalBookings: number;
  awaitingPayment: number;
  startingSoon: number;
  unassignedToday: number;
  /** Active bookings in the next 14 days whose staff member is on leave that day. */
  bookingsOnLeave: number;
  /** Whether the person viewing is clocked in right now. */
  viewerClockedIn: boolean;
  totalCustomers: number;
  repeatCustomers: number;
  newCustomers30d: number;
  lapsedCustomers: number;
  staffCount: number;
  serviceCount: number;
  hasBusinessHours: boolean;
}

export interface HomePreferences {
  interests: string[];
  pinnedModules: string[];
  hiddenModules: string[];
  moduleUsage: ModuleUsage;
  interestsCompletedAt: Date | null;
}

export interface HomeItem {
  id: string;
  layer: HomeLayer;
  title: string;
  icon: string;
  status: 'available' | 'coming_soon';
  pinned: boolean;
  data: Record<string, unknown>;
}

export interface HomeResponse {
  generatedAt: string;
  layers: Record<HomeLayer, HomeItem[]>;
  hidden: Pick<HomeItem, 'id' | 'layer' | 'title' | 'icon'>[];
}

/**
 * Returns the module's data, or `null` when the module has nothing to say right
 * now (no alert to raise, setup step already done, feature not asked for).
 */
function moduleData(def: ModuleDef, s: HomeSnapshot, prefs: HomePreferences): Record<string, unknown> | null {
  if (def.status === 'coming_soon') {
    return def.interests.some((i) => prefs.interests.includes(i)) ? {} : null;
  }
  switch (def.id) {
    case 'awaiting_payment':
      return s.awaitingPayment > 0 ? { count: s.awaitingPayment } : null;
    case 'starting_soon':
      return s.startingSoon > 0 ? { count: s.startingSoon } : null;
    case 'unassigned_today':
      return s.unassignedToday > 0 && s.staffCount > 1 ? { count: s.unassignedToday } : null;
    case 'bookings_on_leave':
      return s.bookingsOnLeave > 0 ? { count: s.bookingsOnLeave } : null;
    case 'clock_in':
      return { clockedIn: s.viewerClockedIn };
    case 'today_bookings':
      return { count: s.todayBookings };
    case 'upcoming_bookings':
      return { bookings: s.upcoming };
    case 'today_sales':
      return { amountKobo: s.todaySalesKobo };
    case 'sales_30d':
      return { amountKobo: s.sales30dKobo };
    case 'repeat_customers':
      return { count: s.repeatCustomers, totalCustomers: s.totalCustomers };
    case 'new_customers':
      return { count: s.newCustomers30d };
    case 'team':
      return { count: s.staffCount };
    case 'share_booking_link':
      return { url: s.bookingLink };
    case 'choose_interests':
      return prefs.interestsCompletedAt ? null : {};
    case 'setup_services':
      return s.serviceCount === 0 ? {} : null;
    case 'setup_hours':
      return s.hasBusinessHours ? null : {};
    case 'share_link_first':
      return s.totalBookings === 0 ? { url: s.bookingLink } : null;
    case 'follow_up_lapsed':
      return s.lapsedCustomers > 0 ? { count: s.lapsedCustomers } : null;
    default:
      return {};
  }
}

export function buildHome(
  snapshot: HomeSnapshot,
  prefs: HomePreferences,
  role: string,
  now: Date,
): HomeResponse {
  const data = new Map<string, Record<string, unknown>>();
  for (const def of MODULES) {
    const d = moduleData(def, snapshot, prefs);
    if (d) data.set(def.id, d);
  }

  const ranked = rankModules(
    MODULES.filter((def) => data.has(def.id)),
    {
      interests: prefs.interests,
      pinned: prefs.pinnedModules,
      hidden: prefs.hiddenModules,
      usage: prefs.moduleUsage,
      role,
      now,
    },
  );

  const toItem = (def: ModuleDef): HomeItem => ({
    id: def.id,
    layer: def.layer,
    title: def.title,
    icon: def.icon,
    status: def.status ?? 'available',
    pinned: prefs.pinnedModules.includes(def.id),
    data: data.get(def.id) ?? {},
  });

  return {
    generatedAt: now.toISOString(),
    layers: {
      attention: ranked.layers.attention.map(toItem),
      overview: ranked.layers.overview.map(toItem),
      quick_action: ranked.layers.quick_action.map(toItem),
      recommendation: ranked.layers.recommendation.map(toItem),
    },
    hidden: ranked.hidden.map(({ id, layer, title, icon }) => ({ id, layer, title, icon })),
  };
}
