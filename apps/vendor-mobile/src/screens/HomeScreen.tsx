import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { formatDateTime, getHome, recordModuleUsage, type HomeItem, type HomeResponse } from '../lib/api';
import { getSession } from '../lib/session';
import { colors, fonts, radius, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const GUTTER = 24;
const SLIDE_GAP = 12;

const ATTENTION: Record<string, { text: (n: number) => string; action: string }> = {
  awaiting_payment: { text: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`, action: 'View' },
  starting_soon: { text: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`, action: 'View' },
  unassigned_today: { text: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff`, action: 'Assign' },
  bookings_on_leave: { text: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`, action: 'Review' },
};

/** One carousel slide: copy, a tint, and three icons for the small illustration. */
interface Slide {
  key: string;
  title: string;
  body: string;
  cta?: string;
  tint: string;
  tone: string;
  icons: [FeatherName, FeatherName, FeatherName];
  onPress?: () => void;
}

function overviewValue(item: HomeItem): string {
  const d = item.data;
  if (typeof d.amountKobo === 'number') return `₦${(d.amountKobo / 100).toLocaleString('en-NG')}`;
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`;
  if (typeof d.count === 'number') return String(d.count);
  return '—';
}

function SectionHeading({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      {link && onLink ? (
        <Pressable onPress={onLink} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionLink}>{link}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A tinted blob with one large icon chip and two small ones — the slide's illustration. */
function SlideArt({ slide }: { slide: Slide }) {
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.artBlob} />
      <View style={[styles.artChip, { width: 62, height: 62, borderRadius: 31, left: 22, top: 28, backgroundColor: slide.tone }]}>
        <Feather name={slide.icons[0]} size={28} color={colors.white} />
      </View>
      <View style={[styles.artChip, { width: 40, height: 40, borderRadius: 20, left: 62, top: 2, backgroundColor: colors.white }]}>
        <Feather name={slide.icons[1]} size={18} color={slide.tone} />
      </View>
      <View style={[styles.artChip, { width: 36, height: 36, borderRadius: 18, left: 68, top: 80, backgroundColor: colors.white }]}>
        <Feather name={slide.icons[2]} size={16} color={slide.tone} />
      </View>
    </View>
  );
}

function Carousel({ slides }: { slides: Slide[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = width - GUTTER * 2;
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + SLIDE_GAP));
    setIndex(Math.max(0, Math.min(slides.length - 1, i)));
  }

  return (
    <View style={{ gap: spacing.md }}>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth + SLIDE_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: SLIDE_GAP }}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {slides.map((s, i) => (
          <View
            key={s.key}
            style={[styles.slide, { width: slideWidth, backgroundColor: s.tint }]}
            accessibilityLabel={`${i + 1} of ${slides.length}: ${s.title}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideBody}>{s.body}</Text>
              {s.cta && s.onPress ? (
                <Pressable style={styles.slideCta} onPress={s.onPress} accessibilityRole="button">
                  <Text style={styles.slideCtaText}>{s.cta}</Text>
                  <Feather name="arrow-right" size={15} color={colors.white} />
                </Pressable>
              ) : (
                <View style={styles.soonTag}><Text style={styles.soonText}>Coming soon</Text></View>
              )}
            </View>
            <SlideArt slide={s} />
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <Pressable
              key={s.key}
              hitSlop={8}
              onPress={() => scroller.current?.scrollTo({ x: i * (slideWidth + SLIDE_GAP), animated: true })}
              accessibilityRole="button"
              accessibilityLabel={`Show slide ${i + 1}`}
              style={[styles.dot, i === index && styles.dotOn]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const session = getSession();
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setHome(await getHome());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your business overview.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever Home comes back into view — interests or setup may have changed.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const isManager = session?.role === 'owner' || session?.role === 'manager';
  const firstName = (session?.name ?? '').split(' ')[0] || 'there';

  function open(item: HomeItem) {
    if (item.status === 'coming_soon') return;
    recordModuleUsage(item.id);
    switch (item.id) {
      case 'share_booking_link':
      case 'share_link_first':
        void Share.share({ message: `Book an appointment with us on Scalio: ${item.data.url}` });
        return;
      case 'awaiting_payment':
      case 'starting_soon':
      case 'unassigned_today':
      case 'bookings_on_leave':
      case 'upcoming_bookings':
      case 'view_bookings':
        navigation.navigate('Bookings');
        return;
      case 'repeat_customers':
      case 'new_customers':
      case 'view_customers':
      case 'follow_up_lapsed':
        navigation.navigate('Customers');
        return;
      case 'team':
      case 'manage_team':
        navigation.navigate('StaffManagement');
        return;
      case 'add_service':
      case 'setup_services':
        navigation.navigate('ServiceForm', {});
        return;
      case 'business_hours':
      case 'setup_hours':
        navigation.navigate('BusinessHours');
        return;
      case 'clock_in':
        navigation.navigate('Attendance');
        return;
      case 'staff_performance':
        navigation.navigate('Performance');
        return;
      case 'choose_interests':
        navigation.navigate('InterestSelection', { fromSettings: true });
        return;
    }
  }

  const attention = home?.layers.attention ?? [];
  const quick = home?.layers.quick_action.slice(0, 4) ?? [];
  const overview = home?.layers.overview.filter((i) => i.id !== 'upcoming_bookings') ?? [];
  const upcoming = home?.layers.overview.find((i) => i.id === 'upcoming_bookings');
  const slides = home ? buildSlides(home) : [];

  /** Carousel slides from the ranked suggestions, plus sharing and staff set-up when they apply. */
  function buildSlides(h: HomeResponse): Slide[] {
    const byId = (id: string) =>
      [...h.layers.recommendation, ...h.layers.quick_action, ...h.layers.overview].find((i) => i.id === id);
    const recs = h.layers.recommendation;
    const out: Slide[] = [];
    const add = (item: HomeItem | undefined, s: Omit<Slide, 'key' | 'onPress'>) => {
      if (item && !out.some((o) => o.key === item.id)) out.push({ ...s, key: item.id, onPress: () => open(item) });
    };

    // Set-up steps first: nothing else matters until customers can book.
    add(byId('choose_interests'), { title: 'Make Scalio yours', body: "Tell us what you want help with and we'll set up your home.", cta: 'Start', tint: colors.accentLight, tone: colors.accent, icons: ['sliders', 'star', 'compass'] });
    add(byId('setup_services'), { title: 'Add your first service', body: 'Customers can only book once you have at least one.', cta: 'Add service', tint: colors.mintSoft, tone: colors.success, icons: ['plus-circle', 'scissors', 'tag'] });
    add(byId('setup_hours'), { title: 'Set your opening hours', body: "Let customers know when you're open.", cta: 'Set hours', tint: colors.mintSoft, tone: colors.success, icons: ['clock', 'calendar', 'sun'] });

    const share = byId('share_link_first') ?? byId('share_booking_link');
    if (share) {
      out.push({
        key: 'share', title: 'Get your next booking', body: 'Share your booking link on WhatsApp and Instagram.', cta: 'Share link',
        tint: colors.accentLight, tone: colors.accent, icons: ['message-circle', 'share-2', 'calendar'], onPress: () => open(share),
      });
    }
    const team = byId('team');
    if (isManager && team && (team.data.count ?? 0) > 1) {
      out.push({
        key: 'staff', title: "Know who's working", body: 'Set staff hours and let your team clock in from their phones.', cta: 'Set up',
        tint: colors.mintSoft, tone: colors.success, icons: ['clock', 'user-check', 'users'], onPress: () => navigation.navigate('StaffManagement'),
      });
    }
    const lapsed = byId('follow_up_lapsed');
    add(lapsed, {
      title: 'Bring customers back',
      body: `${lapsed?.data.count} ${lapsed?.data.count === 1 ? 'customer is' : 'customers are'} past their usual return time.`,
      cta: 'Review', tint: colors.amberSoft, tone: colors.warning, icons: ['repeat', 'heart', 'message-circle'],
    });
    // Features on the way, for businesses that asked for them. Never actionable.
    for (const r of recs.filter((x) => x.status === 'coming_soon')) {
      out.push({
        key: r.id, title: r.title, body: "Coming soon. We'll let you know when it's ready.",
        tint: colors.surface, tone: colors.textMuted, icons: [r.icon as FeatherName, 'clock', 'bell'],
      });
    }
    return out;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: soft Scalio-blue wash fading into the page */}
      <LinearGradient
        colors={[colors.accentLight, colors.sky, colors.background]}
        locations={[0, 0.55, 1]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{(home?.business.name ?? 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bizName} numberOfLines={1}>{home?.business.name ?? 'Your business'}</Text>
            <Text style={styles.bizRole}>{session?.role?.replace('_', ' ') ?? ''}</Text>
          </View>
          <Pressable style={styles.roundBtn} onPress={() => navigation.navigate('Customers')} accessibilityRole="button" accessibilityLabel="Search customers">
            <Feather name="search" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.roundBtn}
            onPress={() => navigation.navigate('Bookings')}
            accessibilityRole="button"
            accessibilityLabel={`${attention.length} items need your attention`}
          >
            <Feather name="bell" size={18} color={colors.text} />
            {attention.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{attention.length > 9 ? '9+' : attention.length}</Text></View>
            )}
          </Pressable>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Text style={styles.avatarText}>{(session?.name ?? 'V').slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hey, {firstName}</Text>
        <Text style={styles.greetingSub}>Here's your business today.</Text>

        {quick.length > 0 && (
          <View style={styles.quick}>
            {quick.map((item) => (
              <Pressable key={item.id} style={styles.quickItem} onPress={() => open(item)} accessibilityRole="button">
                <View style={styles.quickDisc}>
                  <Feather name={item.icon as FeatherName} size={22} color={colors.accent} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {item.id === 'clock_in' && item.data.clockedIn ? 'Clock out' : item.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.xxl }} color={colors.accent} />
      ) : !home ? (
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={26} color={colors.textMuted} />
          <Text style={styles.metaText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.sectionLink}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Needs your attention — always present, so "all clear" is visible too */}
          <View style={styles.section}>
            <SectionHeading title="Needs your attention" />
            <View style={styles.panel}>
              {attention.length === 0 ? (
                <View style={styles.row}>
                  <Text style={[styles.rowText, { color: colors.textMuted }]}>Nothing needs you right now</Text>
                  <View style={[styles.darkBtn, styles.darkBtnOff]}>
                    <Text style={[styles.darkBtnText, { color: colors.textMuted }]}>All clear</Text>
                  </View>
                </View>
              ) : (
                attention.map((item, i) => (
                  <View key={item.id} style={[styles.row, i > 0 && styles.divider]}>
                    <View style={styles.flag} />
                    <Text style={styles.rowText}>{ATTENTION[item.id]?.text(item.data.count) ?? item.title}</Text>
                    <Pressable style={styles.darkBtn} onPress={() => open(item)} accessibilityRole="button">
                      <Text style={styles.darkBtnText}>{ATTENTION[item.id]?.action ?? 'View'}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {slides.length > 0 && <Carousel slides={slides} />}

          {upcoming && (
            <View style={styles.section}>
              <SectionHeading title="Up next" link="View all" onLink={() => open(upcoming)} />
              <View style={styles.panel}>
                {upcoming.data.bookings.length === 0 ? (
                  <View style={styles.empty}>
                    <Feather name="calendar" size={18} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No upcoming bookings yet. Share your booking link to get some.</Text>
                  </View>
                ) : (
                  upcoming.data.bookings.map(
                    (b: { id: string; customerName: string | null; scheduledAt: string; status: string }, i: number) => (
                      <Pressable key={b.id} style={[styles.row, i > 0 && styles.divider]} onPress={() => open(upcoming)}>
                        <View style={styles.person}>
                          <Text style={styles.personInitial}>{(b.customerName ?? 'C').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowStrong} numberOfLines={1}>{b.customerName ?? 'Customer'}</Text>
                          <Text style={styles.metaText}>
                            {formatDateTime(b.scheduledAt)}
                            {b.status === 'pending_payment' ? ' · awaiting payment' : ''}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.borderStrong} />
                      </Pressable>
                    ),
                  )
                )}
              </View>
            </View>
          )}

          {overview.length > 0 && (
            <View style={styles.section}>
              <SectionHeading title="Your business" />
              <View style={styles.panel}>
                {overview.map((item, i) => (
                  <Pressable key={item.id} style={[styles.row, i > 0 && styles.divider]} onPress={() => open(item)} accessibilityRole="button">
                    <Feather name={item.icon as FeatherName} size={18} color={colors.textMuted} />
                    <Text style={styles.rowText}>{item.title}</Text>
                    <Text style={styles.value}>{overviewValue(item)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {isManager && (
            <Pressable style={styles.customise} onPress={() => navigation.navigate('CustomiseHome')} accessibilityRole="button">
              <Feather name="sliders" size={15} color={colors.accent} />
              <Text style={styles.sectionLink}>Customise home</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: GUTTER, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: fonts.displayExtraBold, fontSize: 18, color: colors.accent },
  bizName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  bizRole: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, textTransform: 'capitalize', marginTop: 1 },
  roundBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.error, borderWidth: 2, borderColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  greeting: { fontFamily: fonts.displayExtraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.text, marginTop: 28 },
  greetingSub: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary, marginTop: 6 },
  quick: { flexDirection: 'row', marginTop: 26 },
  quickItem: { flex: 1, alignItems: 'center', gap: 10, paddingHorizontal: 2 },
  quickDisc: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 2,
  },
  quickLabel: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, color: colors.text, textAlign: 'center' },

  // Body
  body: { gap: 32, paddingTop: spacing.sm },
  section: { paddingHorizontal: GUTTER, gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 21, letterSpacing: -0.4, color: colors.text },
  sectionLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  panel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.text },
  rowStrong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  value: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  metaText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
  flag: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.warning },
  darkBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  darkBtnOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  darkBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  person: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  personInitial: { fontFamily: fonts.bold, fontSize: 15, color: colors.accent },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 18 },
  emptyText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  // Carousel
  slide: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingVertical: 22, paddingLeft: 22, paddingRight: 16, minHeight: 172, gap: spacing.sm },
  slideTitle: { fontFamily: fonts.displayExtraBold, fontSize: 22, lineHeight: 25, letterSpacing: -0.4, color: colors.text },
  slideBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8, marginBottom: 16 },
  slideCta: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10,
  },
  slideCtaText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  soonTag: { alignSelf: 'flex-start', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  soonText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textSecondary },
  art: { width: 104, height: 120 },
  artBlob: { position: 'absolute', left: 4, top: 6, right: 0, bottom: 0, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.65)' },
  artChip: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.accent },

  customise: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  errorBox: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  retry: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
