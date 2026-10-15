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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  formatDateTime,
  formatNaira,
  getHome,
  recordModuleUsage,
  updatePreferences,
  type HomeItem,
  type HomeResponse,
} from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

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

function overviewValue(item: HomeItem): string {
  const d = item.data;
  if (typeof d.amountKobo === 'number') return formatNaira(d.amountKobo);
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`;
  if (typeof d.count === 'number') return String(d.count);
  return '—';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Small round icon button used in the header. */
function CircleButton({
  icon,
  onPress,
  badge,
  label,
}: {
  icon: FeatherName;
  onPress: () => void;
  badge?: number;
  label: string;
}) {
  return (
    <Pressable style={styles.circleBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Feather name={icon} size={18} color={colors.text} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** A full-width section card with an icon, title and optional pill link — the building block of Home. */
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
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Feather name={icon} size={16} color={colors.accent} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {linkLabel && onLink ? (
          <Pressable style={styles.greyPill} onPress={onLink} accessibilityRole="button">
            <Text style={styles.greyPillText}>{linkLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
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
  const overview = home?.layers.overview.filter((i) => i.id !== 'upcoming_bookings') ?? [];
  const upcoming = home?.layers.overview.find((i) => i.id === 'upcoming_bookings');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: business, shortcuts, search and greeting on a soft Scalio-blue wash */}
      <LinearGradient colors={[colors.accentLight, colors.surface]} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.topRow}>
          <View style={styles.businessLogo}>
            <Text style={styles.businessInitial}>{(home?.business.name ?? 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName} numberOfLines={1}>{home?.business.name ?? 'Your business'}</Text>
            <Text style={styles.roleText}>{session?.role?.replace('_', ' ') ?? ''}</Text>
          </View>
          <CircleButton icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
          <CircleButton
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
          <Feather name="search" size={16} color={colors.textMuted} />
          <Text style={styles.searchText}>Search customers</Text>
        </Pressable>

        <Text style={styles.greeting}>{greeting()}, {firstName} 👋</Text>
        <Text style={styles.greetingSub}>Here's your business today.</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.xxl }} color={colors.accent} />
      ) : !home ? (
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={26} color={colors.textMuted} />
          <Text style={styles.mutedText}>{error}</Text>
          <Pressable style={styles.greyPill} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.greyPillText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Needs your attention — always present, so "all clear" is visible too */}
          <Section icon="alert-circle" title="Needs your attention">
            {attention.length === 0 ? (
              <View style={styles.row}>
                <Text style={[styles.rowText, styles.mutedText]}>Nothing needs you right now</Text>
                <View style={[styles.blackPill, styles.pillDisabled]}>
                  <Text style={[styles.blackPillText, { color: colors.textMuted }]}>All clear</Text>
                </View>
              </View>
            ) : (
              attention.map((item, i) => (
                <View key={item.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <Text style={styles.rowText}>{ATTENTION[item.id]?.text(item.data.count) ?? item.title}</Text>
                  <Pressable style={styles.blackPill} onPress={() => open(item)} accessibilityRole="button">
                    <Text style={styles.blackPillText}>{ATTENTION[item.id]?.action ?? 'View'}</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Section>

          {/* Overview as a list, in ranked order — no tiles */}
          {overview.length > 0 && (
            <Section icon="activity" title="Your business" linkLabel="View bookings" onLink={() => navigation.navigate('Bookings')}>
              {overview.map((item, i) => (
                <Pressable
                  key={item.id}
                  style={[styles.statRow, i > 0 && styles.rowDivider]}
                  onPress={() => open(item)}
                  accessibilityRole="button"
                >
                  <Feather name={item.icon as FeatherName} size={16} color={colors.textMuted} />
                  <Text style={styles.statLabel}>{item.title}</Text>
                  <Text style={styles.statValue}>{overviewValue(item)}</Text>
                  <Feather name="chevron-right" size={16} color={colors.disabled} />
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
                  <Feather name="info" size={16} color={colors.textMuted} />
                  <Text style={styles.emptyText}>You have no upcoming bookings. Share your booking link to get some.</Text>
                </View>
              ) : (
                upcoming.data.bookings.map(
                  (b: { id: string; customerName: string | null; scheduledAt: string; status: string }, i: number) => (
                    <Pressable key={b.id} style={[styles.statRow, i > 0 && styles.rowDivider]} onPress={() => open(upcoming)}>
                      <View style={styles.personDot}>
                        <Text style={styles.personInitial}>{(b.customerName ?? 'C').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTextStrong} numberOfLines={1}>{b.customerName ?? 'Customer'}</Text>
                        <Text style={styles.metaText}>
                          {formatDateTime(b.scheduledAt)}
                          {b.status === 'pending_payment' ? ' · awaiting payment' : ''}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.disabled} />
                    </Pressable>
                  ),
                )
              )}
            </Section>
          )}

          {/* Quick actions as pills you can scroll through */}
          {home.layers.quick_action.length > 0 && (
            <View>
              <Text style={styles.blockTitle}>Quick actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                {home.layers.quick_action.map((item) => (
                  <Pressable key={item.id} style={styles.actionPill} onPress={() => open(item)} accessibilityRole="button">
                    <Feather name={item.icon as FeatherName} size={15} color={colors.accent} />
                    <Text style={styles.actionPillText}>
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
                  <View key={item.id} style={[styles.suggestion, i > 0 && styles.rowDivider]}>
                    <View style={[styles.suggestionIcon, soon && { backgroundColor: colors.surface }]}>
                      <Feather name={item.icon as FeatherName} size={16} color={soon ? colors.textMuted : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTextStrong, soon && { color: colors.textSecondary }]}>{item.title}</Text>
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
                      <Pressable style={styles.outlinePill} onPress={() => open(item)} accessibilityRole="button">
                        <Text style={styles.outlinePillText}>{SUGGESTION[item.id]?.action ?? 'Open'}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </Section>
          )}

          {canCustomise && (
            <Pressable style={styles.wideButton} onPress={() => navigation.navigate('CustomiseHome')} accessibilityRole="button">
              <Text style={styles.wideButtonText}>Customise home</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  businessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  businessInitial: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.accent },
  businessName: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  roleText: { fontSize: typography.size.xs, color: colors.textMuted, textTransform: 'capitalize' },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: typography.weight.bold },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchText: { fontSize: typography.size.base, color: colors.textMuted },
  greeting: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.xl },
  greetingSub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4 },
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  section: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text },
  sectionSubtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginBottom: spacing.xs },
  greyPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  greyPillText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.surface },
  rowText: { flex: 1, fontSize: typography.size.md, color: colors.text, lineHeight: 21 },
  rowTextStrong: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  mutedText: { color: colors.textMuted },
  metaText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  blackPill: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  blackPillText: { color: colors.white, fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  pillDisabled: { backgroundColor: colors.surface },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  statLabel: { flex: 1, fontSize: typography.size.md, color: colors.text },
  statValue: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  personDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: { color: colors.accent, fontWeight: typography.weight.bold },
  emptyBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  emptyText: { flex: 1, fontSize: typography.size.base, color: colors.textSecondary, lineHeight: 20 },
  blockTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionPillText: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.text },
  suggestion: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismiss: { fontSize: typography.size.sm, color: colors.accent, fontWeight: typography.weight.medium, marginTop: spacing.sm },
  outlinePill: {
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  outlinePillText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  soonTag: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  soonText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  wideButton: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  wideButtonText: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  errorBox: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
});
