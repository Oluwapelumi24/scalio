import { buildHome, type HomePreferences, type HomeSnapshot } from './home';

const now = new Date('2026-10-15T08:00:00Z');

const snapshot: HomeSnapshot = {
  businessName: 'Fade House',
  bookingLink: 'http://localhost:3003/book/fade-house',
  sales30dKobo: 92_000_000,
  upcoming: [{ id: 'b1', scheduledAt: '2026-10-15T10:00:00Z', status: 'confirmed', customerName: 'Tunde' }],
  totalBookings: 120,
  awaitingPayment: 0,
  startingSoon: 0,
  unassignedToday: 0,
  bookingsOnLeave: 0,
  payoutAccountSet: true,
  payrollSetUp: false,
  payrollOpen: null,
  wantsPayroll: false,
  totalCustomers: 60,
  repeatCustomers: 25,
  newCustomers30d: 9,
  lapsedCustomers: 0,
  staffCount: 4,
  serviceCount: 6,
  hasBusinessHours: true,
  leadsDue: 0,
  postsPlannedToday: 0,
  postCount: 0,
  rating: null,
  unhappyToCall: 0,
  feedbackToSend: 0,
  quietDay: null,
  noShows: null,
};

const prefs = (interests: string[], extra: Partial<HomePreferences> = {}): HomePreferences => ({
  interests,
  pinnedModules: [],
  hiddenModules: [],
  moduleUsage: {},
  interestsCompletedAt: new Date('2026-10-01T00:00:00Z'),
  ...extra,
});

const top = (home: ReturnType<typeof buildHome>, layer: keyof ReturnType<typeof buildHome>['layers'], n = 2) =>
  home.layers[layer].slice(0, n).map((i) => i.id);

// The three reference businesses from the product brief: same platform, same
// module registry, different home screens.
describe('buildHome — reference businesses', () => {
  it('Business A, booking-focused (solo barber): bookings first', () => {
    const home = buildHome(snapshot, prefs(['manage_bookings', 'repeat_customers']), 'owner', now);
    expect(top(home, 'overview')).toEqual(['upcoming_bookings', 'repeat_customers']);
    expect(top(home, 'quick_action', 1)).toEqual(['share_booking_link']);
  });

  it('Business B, growth-focused (fashion retailer): new customers, posting and sharing first', () => {
    const home = buildHome(snapshot, prefs(['find_customers', 'run_ads', 'social_posts']), 'owner', now);
    expect(top(home, 'overview', 1)).toEqual(['new_customers']);
    expect(top(home, 'quick_action', 3)).toEqual(['create_post', 'view_leads', 'share_booking_link']);
    expect(home.layers.recommendation.map((i) => i.id)).toEqual(
      expect.arrayContaining(['first_post', 'ads_soon']),
    );
  });

  it('Business C, finance-focused: sales first', () => {
    const home = buildHome(snapshot, prefs(['track_sales', 'get_financing']), 'owner', now);
    expect(top(home, 'overview')).toEqual(['sales_30d', 'upcoming_bookings']);
  });
});

describe('buildHome — rules', () => {
  it('always shows operational alerts, whatever the interests', () => {
    const home = buildHome({ ...snapshot, awaitingPayment: 2 }, prefs(['run_ads'], { hiddenModules: ['awaiting_payment'] }), 'owner', now);
    expect(home.layers.attention.map((i) => i.id)).toEqual(['awaiting_payment']);
    expect(home.layers.attention[0].data).toEqual({ count: 2 });
  });

  it('raises an alert while payroll is open and people are still to be paid', () => {
    const home = buildHome({ ...snapshot, payrollSetUp: true, payrollOpen: { period: '2026-10', toPay: 3, closesOn: '2026-10-30' } }, prefs([]), 'owner', now);
    expect(home.layers.attention.find((i) => i.id === 'payroll_open')?.data).toEqual({ period: '2026-10', toPay: 3, closesOn: '2026-10-30' });
    expect(home.layers.quick_action.map((i) => i.id)).toContain('pay_staff');
  });

  it('suggests taking payments online until the owner adds a payout account', () => {
    const fresh = buildHome({ ...snapshot, payoutAccountSet: false }, prefs([]), 'owner', now);
    expect(fresh.layers.recommendation.map((i) => i.id)).toContain('setup_payments');
    const manager = buildHome({ ...snapshot, payoutAccountSet: false }, prefs([]), 'manager', now);
    expect(manager.layers.recommendation.map((i) => i.id)).not.toContain('setup_payments');
  });

  it('suggests payroll set-up to teams, and to anyone who asked for help paying staff', () => {
    expect(buildHome({ ...snapshot, wantsPayroll: true }, prefs([]), 'owner', now).layers.recommendation.map((i) => i.id)).toContain('setup_payroll');
    expect(buildHome(snapshot, prefs(['pay_staff']), 'owner', now).layers.recommendation.map((i) => i.id)).toContain('setup_payroll');
    expect(buildHome(snapshot, prefs([]), 'owner', now).layers.recommendation.map((i) => i.id)).not.toContain('setup_payroll');
  });

  it('flags upcoming bookings with staff who will be on leave', () => {
    const home = buildHome({ ...snapshot, bookingsOnLeave: 2 }, prefs([]), 'owner', now);
    expect(home.layers.attention.map((i) => i.id)).toEqual(['bookings_on_leave']);
  });

  it('offers Add a service on Home in place of Clock in, to owners and managers only', () => {
    const ids = (role: string) => buildHome(snapshot, prefs([]), role, now).layers.quick_action.map((i) => i.id);
    expect(ids('owner')).toContain('add_service');
    expect(ids('owner')).not.toContain('clock_in');
    expect(ids('practitioner')).not.toContain('add_service');
  });

  it('hides alerts that have nothing to report', () => {
    expect(buildHome(snapshot, prefs([]), 'owner', now).layers.attention).toEqual([]);
  });

  it('only flags unassigned bookings when there is more than one person to assign', () => {
    const solo = buildHome({ ...snapshot, unassignedToday: 3, staffCount: 1 }, prefs([]), 'owner', now);
    const team = buildHome({ ...snapshot, unassignedToday: 3 }, prefs([]), 'owner', now);
    expect(solo.layers.attention).toEqual([]);
    expect(team.layers.attention.map((i) => i.id)).toEqual(['unassigned_today']);
  });

  it('shows coming-soon features only to businesses that asked for them, marked as coming soon', () => {
    const none = buildHome(snapshot, prefs([]), 'owner', now);
    expect(none.layers.recommendation.filter((i) => i.status === 'coming_soon')).toEqual([]);

    const ads = buildHome(snapshot, prefs(['run_ads']), 'owner', now);
    const item = ads.layers.recommendation.find((i) => i.id === 'ads_soon');
    expect(item?.status).toBe('coming_soon');
  });

  it('suggests setup steps for a brand-new business, starting with interests', () => {
    const fresh = buildHome(
      { ...snapshot, totalBookings: 0, serviceCount: 0, hasBusinessHours: false },
      prefs([], { interestsCompletedAt: null }),
      'owner',
      now,
    );
    expect(fresh.layers.recommendation.map((i) => i.id)).toEqual([
      'choose_interests',
      'setup_services',
      'setup_hours',
      'share_link_first',
    ]);
  });

  it('keeps hidden modules reachable in the hidden list', () => {
    const home = buildHome(snapshot, prefs([], { hiddenModules: ['team'] }), 'owner', now);
    expect(home.hidden.map((h) => h.id)).toEqual(['team']);
  });

  it('does not show money figures or setup tasks to practitioners', () => {
    const home = buildHome(
      { ...snapshot, serviceCount: 0 },
      prefs(['track_sales'], { interestsCompletedAt: null }),
      'practitioner',
      now,
    );
    const shown = Object.values(home.layers).flat().map((i) => i.id);
    expect(shown).toContain('upcoming_bookings');
    expect(shown).not.toContain('sales_30d');
    expect(shown).not.toContain('choose_interests');
    expect(shown).not.toContain('setup_services');
  });
});

describe('buildHome — growth (Phase 4)', () => {
  it('raises due leads for every business, whatever its interests', () => {
    const home = buildHome({ ...snapshot, leadsDue: 3 }, prefs(['track_sales']), 'owner', now);
    expect(home.layers.attention.find((i) => i.id === 'leads_due')?.data).toEqual({ count: 3 });
  });

  it('suggests a first post only to businesses that asked for social posts, and only until they make one', () => {
    expect(buildHome(snapshot, prefs(['social_posts']), 'owner', now).layers.recommendation.map((i) => i.id)).toContain('first_post');
    expect(buildHome(snapshot, prefs(['track_sales']), 'owner', now).layers.recommendation.map((i) => i.id)).not.toContain('first_post');
    expect(buildHome({ ...snapshot, postCount: 1 }, prefs(['social_posts']), 'owner', now).layers.recommendation.map((i) => i.id)).not.toContain('first_post');
  });

  it('keeps the content studio from practitioners', () => {
    const home = buildHome({ ...snapshot, postsPlannedToday: 1 }, prefs(['social_posts']), 'practitioner', now);
    const ids = Object.values(home.layers).flat().map((i) => i.id);
    expect(ids).not.toContain('create_post');
    expect(ids).not.toContain('posts_planned_today');
    expect(ids).toContain('view_leads');
  });
});

describe('buildHome — insights (Phase 5)', () => {
  it('asks owners to call back unhappy customers, whatever their interests', () => {
    const home = buildHome({ ...snapshot, unhappyToCall: 2 }, prefs(['social_posts']), 'owner', now);
    expect(home.layers.attention.find((i) => i.id === 'unhappy_customers')?.data).toEqual({ count: 2 });
    expect(buildHome({ ...snapshot, unhappyToCall: 2 }, prefs([]), 'practitioner', now).layers.attention.map((i) => i.id)).not.toContain('unhappy_customers');
  });

  it('suggests filling the quiet day and deposits only when the data says so', () => {
    const quiet = { weekday: 2, day: 'Tuesday', bookings: 3, averageBookings: 9 };
    const recs = (s: Partial<typeof snapshot>) => buildHome({ ...snapshot, ...s }, prefs(['find_customers', 'manage_bookings']), 'owner', now).layers.recommendation.map((i) => i.id);
    expect(recs({})).not.toEqual(expect.arrayContaining(['quiet_day_offer']));
    expect(recs({ quietDay: quiet, noShows: { noShows: 4, rate: 0.15 } })).toEqual(expect.arrayContaining(['quiet_day_offer', 'deposits_for_no_shows']));
  });

  it('shows the rating tile once there are ratings', () => {
    const home = buildHome({ ...snapshot, rating: { average: 4.6, count: 12 } }, prefs(['reviews_feedback']), 'owner', now);
    expect(home.layers.overview.find((i) => i.id === 'customer_rating')?.data).toEqual({ average: 4.6, count: 12 });
  });
});
