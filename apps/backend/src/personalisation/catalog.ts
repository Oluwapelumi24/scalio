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
/** Who runs marketing: matches the content studio's access. */
const MARKETING: readonly StaffRole[] = ['owner', 'manager', 'front_desk'];

// Registry order is the final tie-breaker, so rankings are fully deterministic.
export const MODULES: readonly ModuleDef[] = [
  // ── Needs your attention: shown whenever there is something to act on ──────
  { id: 'awaiting_payment', layer: 'attention', title: 'Bookings waiting for payment', icon: 'clock', interests: [], basePriority: 30 },
  { id: 'starting_soon', layer: 'attention', title: 'Starting within the hour', icon: 'bell', interests: [], basePriority: 40 },
  { id: 'payroll_open', layer: 'attention', title: 'Payroll is open', icon: 'credit-card', interests: [], basePriority: 25, roles: MANAGERS },
  { id: 'bookings_on_leave', layer: 'attention', title: 'Bookings with staff on leave', icon: 'user-minus', interests: [], basePriority: 35, roles: [...MANAGERS, 'front_desk'] },
  { id: 'leads_due', layer: 'attention', title: 'Leads to follow up', icon: 'phone-call', interests: [], basePriority: 28 },
  { id: 'posts_planned_today', layer: 'attention', title: 'Posts planned for today', icon: 'image', interests: [], basePriority: 15, roles: MARKETING },
  { id: 'unhappy_customers', layer: 'attention', title: 'Unhappy customers to call back', icon: 'frown', interests: [], basePriority: 32, roles: MANAGERS },
  { id: 'unassigned_today', layer: 'attention', title: "Today's bookings with no staff assigned", icon: 'user-x', interests: [], basePriority: 20, roles: [...MANAGERS, 'front_desk'] },

  // ── Business overview ─────────────────────────────────────────────────────
  { id: 'upcoming_bookings', layer: 'overview', title: 'Upcoming bookings', icon: 'list', interests: ['manage_bookings', 'manage_staff'], basePriority: 45 },
  { id: 'sales_30d', layer: 'overview', title: 'Sales, last 30 days', icon: 'bar-chart-2', interests: ['track_sales', 'business_insights', 'get_financing'], basePriority: 20, roles: MANAGERS },
  { id: 'repeat_customers', layer: 'overview', title: 'Repeat customers', icon: 'repeat', interests: ['repeat_customers', 'business_insights', 'reviews_feedback'], basePriority: 15 },
  { id: 'new_customers', layer: 'overview', title: 'New customers, last 30 days', icon: 'user-plus', interests: ['find_customers', 'run_ads', 'social_posts', 'manage_social'], basePriority: 10 },
  { id: 'customer_rating', layer: 'overview', title: 'Customer rating', icon: 'star', interests: ['reviews_feedback', 'repeat_customers', 'business_insights'], basePriority: 12 },
  { id: 'team', layer: 'overview', title: 'Team', icon: 'users', interests: ['manage_staff', 'pay_staff', 'multi_branch'], basePriority: 5, roles: MANAGERS },

  // ── Quick actions ─────────────────────────────────────────────────────────
  { id: 'share_booking_link', layer: 'quick_action', title: 'Share booking link', icon: 'share-2', interests: ['manage_bookings', 'find_customers', 'social_posts', 'manage_social'], basePriority: 40 },
  { id: 'view_bookings', layer: 'quick_action', title: 'Bookings', icon: 'calendar', interests: ['manage_bookings'], basePriority: 35 },
  { id: 'view_customers', layer: 'quick_action', title: 'Customers', icon: 'users', interests: ['repeat_customers', 'chat_customers', 'reviews_feedback', 'find_customers'], basePriority: 25 },
  { id: 'pay_staff', layer: 'quick_action', title: 'Pay staff', icon: 'credit-card', interests: ['pay_staff', 'manage_staff', 'track_sales'], basePriority: 18, roles: MANAGERS },
  { id: 'staff_performance', layer: 'quick_action', title: 'Staff performance', icon: 'award', interests: ['manage_staff', 'business_insights', 'pay_staff'], basePriority: 12, roles: [...MANAGERS, 'practitioner'] },
  { id: 'manage_team', layer: 'quick_action', title: 'Manage staff', icon: 'user-check', interests: ['manage_staff', 'pay_staff'], basePriority: 20, roles: MANAGERS },
  // Took Clock in's place on Home, with its priority and interests (clocking in lives under Settings → Attendance).
  { id: 'add_service', layer: 'quick_action', title: 'Add a service', icon: 'plus-circle', interests: ['manage_bookings', 'manage_stock_orders', 'manage_staff', 'pay_staff'], basePriority: 30, roles: MANAGERS },
  { id: 'create_post', layer: 'quick_action', title: 'Create a post', icon: 'edit-3', interests: ['social_posts', 'manage_social', 'find_customers', 'run_ads'], basePriority: 22, roles: MARKETING },
  { id: 'view_leads', layer: 'quick_action', title: 'Leads', icon: 'inbox', interests: ['find_customers', 'run_ads', 'chat_customers', 'social_posts'], basePriority: 16 },
  { id: 'view_reports', layer: 'quick_action', title: 'Reports', icon: 'bar-chart-2', interests: ['business_insights', 'track_sales', 'get_financing'], basePriority: 14, roles: MANAGERS },
  { id: 'business_hours', layer: 'quick_action', title: 'Opening hours', icon: 'clock', interests: ['manage_bookings', 'manage_staff'], basePriority: 10, roles: MANAGERS },

  // ── Recommendations: rule-based next steps ────────────────────────────────
  { id: 'choose_interests', layer: 'recommendation', title: 'Tell us what you want help with', icon: 'sliders', interests: [], basePriority: 100, roles: MANAGERS },
  { id: 'setup_payments', layer: 'recommendation', title: 'Take payments online', icon: 'credit-card', interests: ['manage_bookings', 'track_sales'], basePriority: 60, roles: ['owner'] },
  { id: 'setup_payroll', layer: 'recommendation', title: 'Set up payroll', icon: 'users', interests: ['pay_staff', 'manage_staff'], basePriority: 55, roles: MANAGERS },
  { id: 'setup_services', layer: 'recommendation', title: 'Add your first service', icon: 'plus-circle', interests: [], basePriority: 90, roles: MANAGERS },
  { id: 'setup_hours', layer: 'recommendation', title: 'Set your opening hours', icon: 'clock', interests: [], basePriority: 80, roles: MANAGERS },
  { id: 'share_link_first', layer: 'recommendation', title: 'Get your first booking', icon: 'share-2', interests: ['manage_bookings', 'find_customers'], basePriority: 70 },
  { id: 'follow_up_lapsed', layer: 'recommendation', title: 'Customers due for a return visit', icon: 'repeat', interests: ['repeat_customers', 'chat_customers'], basePriority: 50 },
  // From the business's own records (personalisation/insights.ts); quiet until there's enough data.
  { id: 'deposits_for_no_shows', layer: 'recommendation', title: 'Cut no-shows with deposits', icon: 'shield', interests: ['manage_bookings', 'track_sales'], basePriority: 48, roles: MANAGERS },
  { id: 'quiet_day_offer', layer: 'recommendation', title: 'Fill your quiet day', icon: 'trending-up', interests: ['find_customers', 'social_posts', 'run_ads', 'business_insights'], basePriority: 40, roles: MARKETING },
  { id: 'ask_for_feedback', layer: 'recommendation', title: 'Ask customers how it went', icon: 'star', interests: ['reviews_feedback', 'repeat_customers'], basePriority: 35, roles: MARKETING },
  { id: 'first_post', layer: 'recommendation', title: 'Make your first post with AI', icon: 'image', interests: ['social_posts', 'manage_social', 'find_customers'], basePriority: 45, roles: MARKETING },
  // Features on the roadmap. Shown only to businesses that asked for them, and
  // only as "coming soon" — never as if they already work.
  { id: 'ads_soon', layer: 'recommendation', title: 'Run ads on Facebook and Instagram', icon: 'target', interests: ['run_ads'], basePriority: 10, status: 'coming_soon' },
  { id: 'inbox_soon', layer: 'recommendation', title: 'Chat with customers in one inbox', icon: 'message-circle', interests: ['chat_customers'], basePriority: 10, status: 'coming_soon' },
  { id: 'orders_soon', layer: 'recommendation', title: 'Track stock and orders', icon: 'package', interests: ['manage_stock_orders'], basePriority: 10, status: 'coming_soon', roles: MANAGERS },
  { id: 'financing_soon', layer: 'recommendation', title: 'Get financing to grow', icon: 'dollar-sign', interests: ['get_financing'], basePriority: 10, status: 'coming_soon', roles: ['owner'] },
  { id: 'branches_soon', layer: 'recommendation', title: 'Manage more than one branch', icon: 'map-pin', interests: ['multi_branch'], basePriority: 10, status: 'coming_soon', roles: MANAGERS },
];

export const MODULE_IDS: readonly string[] = MODULES.map((m) => m.id);
