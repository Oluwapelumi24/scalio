import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  formatDateTime,
  getHome,
  recordModuleUsage,
  updatePreferences,
  type HomeItem,
  type HomeResponse,
} from '../lib/api';
import { getSession } from '../lib/session';
import { colors, fonts, radius, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

// Shown large in the header when the business (and role) has them.
const HERO_IDS = ['today_bookings', 'today_sales'];

const ATTENTION: Record<string, { text: (n: number) => string; action: string }> = {
  awaiting_payment: { text: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`, action: 'View' },
  starting_soon: { text: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`, action: 'View' },
  unassigned_today: { text: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff`, action: 'Assign' },
  bookings_on_leave: { text: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`, action: 'Review' },
};

const SUGGESTION: Record<string, { text: (d: Record<string, any>) => string; action: string }> = {
  choose_interests: { text: () => 'Pick what you want help with and we will set up your home.', action: 'Start' },
  setup_services: { text: () => 'Customers can only book once you have at least one service.', action: 'Add' },
  setup_hours: { text: () => 'Let customers know when you are open.', action: 'Set' },
  share_link_first: { text: () => 'Share your booking link on WhatsApp or Instagram.', action: 'Share' },
  follow_up_lapsed: {
    text: (d) => `${d.count} ${d.count === 1 ? 'customer is' : 'customers are'} past their usual return time.`,
    action: 'Review',
  },
};

/** ₦45k / ₦1.2m — big header figures stay short. */
function nairaShort(kobo: number): string {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
}

function overviewValue(item: HomeItem): string {
  const d = item.data;
  if (typeof d.amountKobo === 'number') return `₦${(d.amountKobo / 100).toLocaleString('en-NG')}`;
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`;
  if (typeof d.count === 'number') return String(d.count);
  return '—';
}

function HeaderButton({ icon, onPress, badge, label }: { icon: FeatherName; onPress: () => void; badge?: number; label: string }) {
  return (
    <Pressable style={styles.headerBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Feather name={icon} size={18} color={colors.onDark} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** A full-width card with an outlined icon tile, a title and an optional pill link. */
function Section({
  icon,
  title,
  subtitle,
  linkLabel,
  onLink,
  children,
}: {
  icon: FeatherName;
  title: string;
  subtitle?: string;
  linkLabel?: string;
  onLink?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Feather name={icon} size={17} color={colors.accent} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        {linkLabel && onLink ? (
          <Pressable style={styles.linkPill} onPress={onLink} accessibilityRole="button">
            <Text style={styles.linkPillText}>{linkLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
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

  const canCustomise = session?.role === 'owner' || session?.role === 'manager';
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
      case 'today_bookings':
      case 'today_sales':
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

  /** "Dismiss" hides a suggestion; it stays available under Customise home. */
  async function dismiss(item: HomeItem) {
    if (!home) return;
    try {
      await updatePreferences({ hiddenModules: [...home.hidden.map((h) => h.id), item.id] });
      await load();
    } catch (err) {
      Alert.alert('Could not dismiss', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  const attention = home?.layers.attention ?? [];
  const hero = HERO_IDS.map((id) => home?.layers.overview.find((i) => i.id === id)).filter(
    (i): i is HomeItem => !!i,
  );
  const overview = home?.layers.overview.filter((i) => i.id !== 'upcoming_bookings' && !HERO_IDS.includes(i.id)) ?? [];
  const upcoming = home?.layers.overview.find((i) => i.id === 'upcoming_bookings');

  return (
    <View style={styles.root}>
      {isFocused && <StatusBar style="light" />}
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl tintColor={colors.onDark} refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header: deep Scalio navy with the day's headline numbers */}
        <LinearGradient
          colors={[colors.accent, colors.ink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
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
            <HeaderButton icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
            <HeaderButton
              icon="bell"
              label={`${attention.length} items need your attention`}
              badge={attention.length}
              onPress={() => navigation.navigate('Bookings')}
            />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(session?.name ?? 'V').slice(0, 2).toUpperCase()}</Text>
            </View>
          </View>

          <Pressable style={styles.search} onPress={() => navigation.navigate('Customers')} accessibilityRole="search">
            <Feather name="search" size={17} color={colors.onDarkMuted} />
            <Text style={styles.searchText}>Search customers</Text>
          </Pressable>

          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
          <Text style={styles.greetingSub}>Here's your business today.</Text>

          {hero.length > 0 && (
            <View style={styles.heroRow}>
              {hero.map((item, i) => (
                <Pressable
                  key={item.id}
                  style={[styles.heroStat, i > 0 && styles.heroDivider]}
                  onPress={() => open(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.heroValue}>
                    {typeof item.data.amountKobo === 'number' ? nairaShort(item.data.amountKobo) : String(item.data.count)}
                  </Text>
                  <Text style={styles.heroLabel}>{item.title}</Text>
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
            <Pressable style={styles.linkPill} onPress={() => { setLoading(true); void load(); }}>
              <Text style={styles.linkPillText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.body}>
            {/* Needs your attention — always present, so "all clear" is visible too */}
            <Section icon="alert-circle" title="Needs your attention">
              {attention.length === 0 ? (
                <View style={styles.row}>
                  <Text style={[styles.rowText, { color: colors.textMuted }]}>Nothing needs you right now</Text>
                  <View style={[styles.actionBtn, styles.actionBtnOff]}>
                    <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>All clear</Text>
                  </View>
                </View>
              ) : (
                attention.map((item, i) => (
                  <View key={item.id} style={[styles.row, i > 0 && styles.divider]}>
                    <View style={styles.alertDot} />
                    <Text style={styles.rowText}>{ATTENTION[item.id]?.text(item.data.count) ?? item.title}</Text>
                    <Pressable style={styles.actionBtn} onPress={() => open(item)} accessibilityRole="button">
                      <Text style={styles.actionBtnText}>{ATTENTION[item.id]?.action ?? 'View'}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </Section>

            {overview.length > 0 && (
              <Section icon="activity" title="Your business" linkLabel="View bookings" onLink={() => navigation.navigate('Bookings')}>
                {overview.map((item, i) => (
                  <Pressable key={item.id} style={[styles.row, i > 0 && styles.divider]} onPress={() => open(item)} accessibilityRole="button">
                    <Feather name={item.icon as FeatherName} size={17} color={colors.textMuted} />
                    <Text style={styles.statLabel}>{item.title}</Text>
                    <Text style={styles.statValue}>{overviewValue(item)}</Text>
                    <Feather name="chevron-right" size={16} color={colors.borderStrong} />
                  </Pressable>
                ))}
              </Section>
            )}

            {upcoming && (
              <Section
                icon="calendar"
                title="Upcoming bookings"
                subtitle="Your next confirmed and pending appointments"
                linkLabel="View all"
                onLink={() => open(upcoming)}
              >
                {upcoming.data.bookings.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Feather name="info" size={17} color={colors.textMuted} />
                    <Text style={styles.emptyText}>You have no upcoming bookings. Share your booking link to get some.</Text>
                  </View>
                ) : (
                  upcoming.data.bookings.map(
                    (b: { id: string; customerName: string | null; scheduledAt: string; status: string }, i: number) => (
                      <Pressable key={b.id} style={[styles.row, i > 0 && styles.divider]} onPress={() => open(upcoming)}>
                        <View style={styles.personDot}>
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
              </Section>
            )}

            {home.layers.quick_action.length > 0 && (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.blockTitle}>Quick actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                  {home.layers.quick_action.map((item) => (
                    <Pressable key={item.id} style={styles.pill} onPress={() => open(item)} accessibilityRole="button">
                      <View style={styles.pillIcon}>
                        <Feather name={item.icon as FeatherName} size={14} color={colors.onDark} />
                      </View>
                      <Text style={styles.pillText}>
                        {item.id === 'clock_in' && item.data.clockedIn ? 'Clock out' : item.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {home.layers.recommendation.length > 0 && (
              <Section icon="compass" title="Suggested for you">
                {home.layers.recommendation.map((item, i) => {
                  const soon = item.status === 'coming_soon';
                  return (
                    <View key={item.id} style={[styles.suggestion, i > 0 && styles.divider]}>
                      <View style={[styles.suggestionIcon, soon && styles.suggestionIconSoon]}>
                        <Feather name={item.icon as FeatherName} size={17} color={soon ? colors.textMuted : colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowStrong, soon && { color: colors.textSecondary }]}>{item.title}</Text>
                        <Text style={styles.metaText}>
                          {soon ? 'Coming soon — we will let you know when it is ready.' : SUGGESTION[item.id]?.text(item.data) ?? ''}
                        </Text>
                        {canCustomise && item.id !== 'choose_interests' && (
                          <Pressable onPress={() => dismiss(item)} hitSlop={6} accessibilityRole="button">
                            <Text style={styles.dismiss}>Dismiss</Text>
                          </Pressable>
                        )}
                      </View>
                      {soon ? (
                        <View style={styles.soonTag}><Text style={styles.soonText}>Soon</Text></View>
                      ) : (
                        <Pressable style={styles.outlineBtn} onPress={() => open(item)} accessibilityRole="button">
                          <Text style={styles.outlineBtnText}>{SUGGESTION[item.id]?.action ?? 'Open'}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </Section>
            )}

            {canCustomise && (
              <Pressable style={styles.wideBtn} onPress={() => navigation.navigate('CustomiseHome')} accessibilityRole="button">
                <Feather name="sliders" size={16} color={colors.text} />
                <Text style={styles.wideBtnText}>Customise home</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: colors.ink,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 2,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mist },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.onDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.accent },
  bizName: { fontFamily: fonts.bold, fontSize: 16, color: colors.onDark },
  bizRole: { fontFamily: fonts.medium, fontSize: 12, color: colors.onDarkMuted, textTransform: 'capitalize', marginTop: 1 },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.onDarkFaint,
    borderWidth: 1,
    borderColor: colors.onDarkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, color: colors.onDark, fontSize: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentLight,
    borderWidth: 2,
    borderColor: colors.onDarkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: colors.onDarkFaint,
    borderWidth: 1,
    borderColor: colors.onDarkLine,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  searchText: { fontFamily: fonts.medium, fontSize: 15, color: colors.onDarkMuted },
  greeting: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.6, color: colors.onDark, marginTop: spacing.xl + spacing.xs },
  greetingSub: { fontFamily: fonts.medium, fontSize: 15, color: colors.onDarkMuted, marginTop: 4 },
  heroRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.onDarkLine,
  },
  heroStat: { flex: 1, gap: 2 },
  heroDivider: { borderLeftWidth: 1, borderLeftColor: colors.onDarkLine, paddingLeft: spacing.xl },
  heroValue: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -1, color: colors.onDark, fontVariant: ['tabular-nums'] },
  heroLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.onDarkMuted },

  // Body — the first card tucks up into the header
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.xxl },
  card: {
    backgroundColor: colors.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.md,
    ...CARD_SHADOW,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.2, color: colors.text },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs },
  linkPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  linkPillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.text },
  rowStrong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  metaText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  actionBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  actionBtnOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDark },
  statLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  statValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  personDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: { fontFamily: fonts.bold, fontSize: 15, color: colors.accent },
  emptyBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  emptyText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  blockTitle: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.2, color: colors.text, paddingHorizontal: spacing.xs },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingLeft: 6,
    paddingRight: spacing.lg,
    paddingVertical: 6,
  },
  pillIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  suggestion: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 14 },
  suggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionIconSoon: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dismiss: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, marginTop: spacing.sm },
  outlineBtn: { borderWidth: 1.5, borderColor: colors.text, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 6 },
  outlineBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  soonTag: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  soonText: { fontFamily: fonts.bold, fontSize: 11, color: colors.textSecondary },
  wideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.lg,
  },
  wideBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  errorBox: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
});
