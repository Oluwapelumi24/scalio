/**
 * The vendor-side personalisation catalog: what a business can say it wants help
 * with, and every module the home screen can show.
 *
 * This is the single source of truth for both vendor apps — mobile and web fetch
 * the interests from the API and receive the home screen already ranked, so the
 * rules never drift between platforms. (The consumer app's interest screen is a
 * separate, customer-side taxonomy and does not use this.)
 */

export const INTEREST_GROUPS = [
  {
    id: 'manage',
    title: 'Manage my business',
    interests: [
      { id: 'manage_bookings', label: 'Manage bookings', icon: 'calendar' },
      { id: 'manage_staff', label: 'Manage my staff', icon: 'users' },
      { id: 'track_sales', label: 'Track my sales and money', icon: 'trending-up' },
      { id: 'pay_staff', label: 'Pay my staff', icon: 'credit-card' },
      { id: 'manage_stock_orders', label: 'Manage my stock and orders', icon: 'package' },
    ],
  },
  {
    id: 'acquire',
    title: 'Get more customers',
    interests: [
      { id: 'find_customers', label: 'Find new customers', icon: 'user-plus' },
      { id: 'run_ads', label: 'Run ads for my business', icon: 'target' },
      { id: 'social_posts', label: 'Make posts for social media', icon: 'image' },
      { id: 'manage_social', label: 'Manage my social media', icon: 'share-2' },
    ],
  },
  {
    id: 'retain',
    title: 'Keep my customers',
    interests: [
      { id: 'repeat_customers', label: 'Get customers to come back', icon: 'repeat' },
      { id: 'reviews_feedback', label: 'Get reviews and feedback', icon: 'star' },
      { id: 'chat_customers', label: 'Chat with my customers', icon: 'message-circle' },
    ],
  },
  {
    id: 'grow',
    title: 'Grow my business',
    interests: [
      { id: 'get_financing', label: 'Get money to grow my business', icon: 'dollar-sign' },
      { id: 'business_insights', label: 'See how my business is doing', icon: 'bar-chart-2' },
      { id: 'multi_branch', label: 'Manage more than one branch', icon: 'map-pin' },
    ],
  },
] as const;

export type InterestId = (typeof INTEREST_GROUPS)[number]['interests'][number]['id'];

export const INTEREST_IDS: readonly string[] = INTEREST_GROUPS.flatMap((g) =>
  g.interests.map((i) => i.id),
);

export type HomeLayer = 'attention' | 'overview' | 'quick_action' | 'recommendation';
export type StaffRole = 'owner' | 'manager' | 'practitioner' | 'front_desk';

export interface ModuleDef {
  id: string;
  layer: HomeLayer;
  title: string;
  /** Feather icon name — both vendor apps use Feather. */
  icon: string;
  /** Interests that pull this module up the home screen. */
  interests: readonly InterestId[];
  /** Ordering before any interest or usage signal; also the tie-breaker baseline. */
  basePriority: number;
  /** Roles allowed to see the module at all (a permission, not a preference). Omitted = everyone. */
  roles?: readonly StaffRole[];
  /** `coming_soon` modules describe a feature Scalio hasn't shipped — never actionable. */
  status?: 'available' | 'coming_soon';
}

const MANAGERS: readonly StaffRole[] = ['owner', 'manager'];

// Registry order is the final tie-breaker, so rankings are fully deterministic.
export const MODULES: readonly ModuleDef[] = [
  // ── Needs your attention: shown whenever there is something to act on ──────
  { id: 'awaiting_payment', layer: 'attention', title: 'Bookings waiting for payment', icon: 'clock', interests: [], basePriority: 30 },
  { id: 'starting_soon', layer: 'attention', title: 'Starting within the hour', icon: 'bell', interests: [], basePriority: 40 },
  { id: 'bookings_on_leave', layer: 'attention', title: 'Bookings with staff on leave', icon: 'user-minus', interests: [], basePriority: 35, roles: [...MANAGERS, 'front_desk'] },
  { id: 'unassigned_today', layer: 'attention', title: "Today's bookings with no staff assigned", icon: 'user-x', interests: [], basePriority: 20, roles: [...MANAGERS, 'front_desk'] },

  // ── Business overview ─────────────────────────────────────────────────────
  { id: 'upcoming_bookings', layer: 'overview', title: 'Upcoming bookings', icon: 'list', interests: ['manage_bookings', 'manage_staff'], basePriority: 45 },
  { id: 'sales_30d', layer: 'overview', title: 'Sales, last 30 days', icon: 'bar-chart-2', interests: ['track_sales', 'business_insights', 'get_financing'], basePriority: 20, roles: MANAGERS },
  { id: 'repeat_customers', layer: 'overview', title: 'Repeat customers', icon: 'repeat', interests: ['repeat_customers', 'business_insights', 'reviews_feedback'], basePriority: 15 },
  { id: 'new_customers', layer: 'overview', title: 'New customers, last 30 days', icon: 'user-plus', interests: ['find_customers', 'run_ads', 'social_posts', 'manage_social'], basePriority: 10 },
  { id: 'team', layer: 'overview', title: 'Team', icon: 'users', interests: ['manage_staff', 'pay_staff', 'multi_branch'], basePriority: 5, roles: MANAGERS },

  // ── Quick actions ─────────────────────────────────────────────────────────
  { id: 'share_booking_link', layer: 'quick_action', title: 'Share booking link', icon: 'share-2', interests: ['manage_bookings', 'find_customers', 'social_posts', 'manage_social'], basePriority: 40 },
  { id: 'view_bookings', layer: 'quick_action', title: 'Bookings', icon: 'calendar', interests: ['manage_bookings'], basePriority: 35 },
  { id: 'view_customers', layer: 'quick_action', title: 'Customers', icon: 'users', interests: ['repeat_customers', 'chat_customers', 'reviews_feedback', 'find_customers'], basePriority: 25 },
  { id: 'clock_in', layer: 'quick_action', title: 'Clock in', icon: 'log-in', interests: ['manage_staff', 'pay_staff'], basePriority: 30 },
  { id: 'staff_performance', layer: 'quick_action', title: 'Staff performance', icon: 'award', interests: ['manage_staff', 'business_insights', 'pay_staff'], basePriority: 12, roles: [...MANAGERS, 'practitioner'] },
  { id: 'manage_team', layer: 'quick_action', title: 'Manage staff', icon: 'user-check', interests: ['manage_staff', 'pay_staff'], basePriority: 20, roles: MANAGERS },
  { id: 'add_service', layer: 'quick_action', title: 'Add a service', icon: 'plus-circle', interests: ['manage_bookings', 'manage_stock_orders'], basePriority: 15, roles: MANAGERS },
  { id: 'business_hours', layer: 'quick_action', title: 'Opening hours', icon: 'clock', interests: ['manage_bookings', 'manage_staff'], basePriority: 10, roles: MANAGERS },

  // ── Recommendations: rule-based next steps ────────────────────────────────
  { id: 'choose_interests', layer: 'recommendation', title: 'Tell us what you want help with', icon: 'sliders', interests: [], basePriority: 100, roles: MANAGERS },
  { id: 'setup_services', layer: 'recommendation', title: 'Add your first service', icon: 'plus-circle', interests: [], basePriority: 90, roles: MANAGERS },
  { id: 'setup_hours', layer: 'recommendation', title: 'Set your opening hours', icon: 'clock', interests: [], basePriority: 80, roles: MANAGERS },
  { id: 'share_link_first', layer: 'recommendation', title: 'Get your first booking', icon: 'share-2', interests: ['manage_bookings', 'find_customers'], basePriority: 70 },
  { id: 'follow_up_lapsed', layer: 'recommendation', title: 'Customers due for a return visit', icon: 'repeat', interests: ['repeat_customers', 'chat_customers'], basePriority: 50 },
  // Features on the roadmap. Shown only to businesses that asked for them, and
  // only as "coming soon" — never as if they already work.
  { id: 'content_studio_soon', layer: 'recommendation', title: 'Create social media posts with AI', icon: 'image', interests: ['social_posts', 'manage_social'], basePriority: 10, status: 'coming_soon' },
  { id: 'ads_soon', layer: 'recommendation', title: 'Run ads on Facebook and Instagram', icon: 'target', interests: ['run_ads'], basePriority: 10, status: 'coming_soon' },
  { id: 'payroll_soon', layer: 'recommendation', title: 'Pay your staff from Scalio', icon: 'credit-card', interests: ['pay_staff'], basePriority: 10, status: 'coming_soon', roles: MANAGERS },
  { id: 'inbox_soon', layer: 'recommendation', title: 'Chat with customers in one inbox', icon: 'message-circle', interests: ['chat_customers'], basePriority: 10, status: 'coming_soon' },
  { id: 'feedback_soon', layer: 'recommendation', title: 'Ask customers for reviews', icon: 'star', interests: ['reviews_feedback'], basePriority: 10, status: 'coming_soon' },
  { id: 'orders_soon', layer: 'recommendation', title: 'Track stock and orders', icon: 'package', interests: ['manage_stock_orders'], basePriority: 10, status: 'coming_soon', roles: MANAGERS },
  { id: 'financing_soon', layer: 'recommendation', title: 'Get financing to grow', icon: 'dollar-sign', interests: ['get_financing'], basePriority: 10, status: 'coming_soon', roles: ['owner'] },
  { id: 'branches_soon', layer: 'recommendation', title: 'Manage more than one branch', icon: 'map-pin', interests: ['multi_branch'], basePriority: 10, status: 'coming_soon', roles: MANAGERS },
];

export const MODULE_IDS: readonly string[] = MODULES.map((m) => m.id);
