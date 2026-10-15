import { buildHome, type HomePreferences, type HomeSnapshot } from './home';

const now = new Date('2026-10-15T08:00:00Z');

const snapshot: HomeSnapshot = {
  bookingLink: 'http://localhost:3003/book/fade-house',
  todayBookings: 8,
  todaySalesKobo: 4_500_000,
  sales30dKobo: 92_000_000,
  upcoming: [{ id: 'b1', scheduledAt: '2026-10-15T10:00:00Z', status: 'confirmed', customerName: 'Tunde' }],
  totalBookings: 120,
  awaitingPayment: 0,
  startingSoon: 0,
  unassignedToday: 0,
  bookingsOnLeave: 0,
  viewerClockedIn: false,
  totalCustomers: 60,
  repeatCustomers: 25,
  newCustomers30d: 9,
  lapsedCustomers: 0,
  staffCount: 4,
  serviceCount: 6,
  hasBusinessHours: true,
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
    expect(top(home, 'overview')).toEqual(['today_bookings', 'upcoming_bookings']);
    expect(top(home, 'quick_action', 1)).toEqual(['share_booking_link']);
  });

  it('Business B, growth-focused (fashion retailer): new customers and sharing first', () => {
    const home = buildHome(snapshot, prefs(['find_customers', 'run_ads', 'social_posts']), 'owner', now);
    expect(top(home, 'overview', 1)).toEqual(['new_customers']);
    expect(top(home, 'quick_action', 1)).toEqual(['share_booking_link']);
    expect(home.layers.recommendation.map((i) => i.id)).toEqual(
      expect.arrayContaining(['content_studio_soon', 'ads_soon']),
    );
  });

  it('Business C, finance-focused: sales first', () => {
    const home = buildHome(snapshot, prefs(['track_sales', 'get_financing']), 'owner', now);
    expect(top(home, 'overview')).toEqual(['today_sales', 'sales_30d']);
  });
});

describe('buildHome — rules', () => {
  it('always shows operational alerts, whatever the interests', () => {
    const home = buildHome({ ...snapshot, awaitingPayment: 2 }, prefs(['run_ads'], { hiddenModules: ['awaiting_payment'] }), 'owner', now);
    expect(home.layers.attention.map((i) => i.id)).toEqual(['awaiting_payment']);
    expect(home.layers.attention[0].data).toEqual({ count: 2 });
  });

  it('flags upcoming bookings with staff who will be on leave', () => {
    const home = buildHome({ ...snapshot, bookingsOnLeave: 2 }, prefs([]), 'owner', now);
    expect(home.layers.attention.map((i) => i.id)).toEqual(['bookings_on_leave']);
  });

  it('tells the clock-in action whether the viewer is on shift', () => {
    const home = buildHome({ ...snapshot, viewerClockedIn: true }, prefs([]), 'practitioner', now);
    expect(home.layers.quick_action.find((i) => i.id === 'clock_in')?.data).toEqual({ clockedIn: true });
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

    const payroll = buildHome(snapshot, prefs(['pay_staff']), 'owner', now);
    const item = payroll.layers.recommendation.find((i) => i.id === 'payroll_soon');
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
    expect(shown).not.toEqual(expect.arrayContaining(['today_sales']));
    expect(shown).not.toContain('sales_30d');
    expect(shown).not.toContain('choose_interests');
    expect(shown).not.toContain('setup_services');
  });
});
