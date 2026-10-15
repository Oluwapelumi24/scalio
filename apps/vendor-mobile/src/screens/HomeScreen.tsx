import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  formatDateTime,
  formatNaira,
  getHome,
  recordModuleUsage,
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

const ATTENTION_TEXT: Record<string, (n: number) => string> = {
  awaiting_payment: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`,
  starting_soon: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`,
  unassigned_today: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff assigned`,
};

const RECOMMENDATION_TEXT: Record<string, (d: Record<string, any>) => string> = {
  choose_interests: () => 'Pick what you want help with and we will set up your home screen.',
  setup_services: () => 'Customers can only book once you have at least one service.',
  setup_hours: () => 'Let customers know when you are open.',
  share_link_first: () => 'Share your booking link on WhatsApp or Instagram.',
  follow_up_lapsed: (d) => `${d.count} ${d.count === 1 ? 'customer is' : 'customers are'} past their usual return time.`,
};

function tileValue(item: HomeItem): string {
  const d = item.data;
  if (typeof d.amountKobo === 'number') return formatNaira(d.amountKobo);
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`;
  if (typeof d.count === 'number') return String(d.count);
  return '—';
}

async function shareLink(url: string) {
  await Share.share({ message: `Book an appointment with us on Scalio: ${url}` });
}

export function HomeScreen({ navigation }: Props) {
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

  function open(item: HomeItem) {
    if (item.status === 'coming_soon') return;
    recordModuleUsage(item.id);
    switch (item.id) {
      case 'share_booking_link':
      case 'share_link_first':
        void shareLink(item.data.url);
        return;
      case 'awaiting_payment':
      case 'starting_soon':
      case 'unassigned_today':
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
      case 'choose_interests':
        navigation.navigate('InterestSelection', { fromSettings: true });
        return;
    }
  }

  const canCustomise = session?.role === 'owner' || session?.role === 'manager';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {greeting()}</Text>
          <Text style={styles.name}>{session?.name ?? 'Vendor'}</Text>
          <Text style={styles.subtitle}>Here's your business today.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(session?.name ?? 'V').charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.xxl }} color={colors.accent} />
      ) : !home ? (
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Layer: needs your attention — always shown when there is something to act on */}
          {home.layers.attention.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Needs your attention</Text>
              {home.layers.attention.map((item) => (
                <Pressable key={item.id} style={styles.alert} onPress={() => open(item)} accessibilityRole="button">
                  <Feather name={item.icon as FeatherName} size={18} color={colors.warning} />
                  <Text style={styles.alertText}>
                    {ATTENTION_TEXT[item.id]?.(item.data.count) ?? item.title}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.warning} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Layer: business overview, in ranked order */}
          <View style={styles.section}>
            <Overview items={home.layers.overview} onOpen={open} />
          </View>

          {/* Layer: quick actions */}
          {home.layers.quick_action.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.actions}>
                {home.layers.quick_action.map((item) => (
                  <Pressable key={item.id} style={styles.action} onPress={() => open(item)} accessibilityRole="button">
                    <View style={styles.actionIcon}>
                      <Feather name={item.icon as FeatherName} size={20} color={colors.accent} />
                    </View>
                    <Text style={styles.actionLabel} numberOfLines={2}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Layer: recommendations */}
          {home.layers.recommendation.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggested for you</Text>
              {home.layers.recommendation.map((item) => {
                const soon = item.status === 'coming_soon';
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.rec, soon && styles.recSoon]}
                    onPress={() => open(item)}
                    disabled={soon}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: soon }}
                  >
                    <View style={[styles.recIcon, soon && { backgroundColor: colors.surface }]}>
                      <Feather name={item.icon as FeatherName} size={18} color={soon ? colors.textMuted : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recTitle, soon && { color: colors.textSecondary }]}>{item.title}</Text>
                      <Text style={styles.recText}>
                        {soon ? 'Coming soon — we will let you know when it is ready.' : RECOMMENDATION_TEXT[item.id]?.(item.data) ?? ''}
                      </Text>
                    </View>
                    {soon ? (
                      <View style={styles.soonBadge}><Text style={styles.soonText}>Soon</Text></View>
                    ) : (
                      <Feather name="chevron-right" size={16} color={colors.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {canCustomise && (
            <Pressable style={styles.customise} onPress={() => navigation.navigate('CustomiseHome')} accessibilityRole="button">
              <Feather name="sliders" size={15} color={colors.accent} />
              <Text style={styles.customiseText}>Customise home</Text>
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );
}

/** Stat tiles in ranked order, then the upcoming-bookings list if it made the cut. */
function Overview({ items, onOpen }: { items: HomeItem[]; onOpen: (item: HomeItem) => void }) {
  const tiles = items.filter((i) => i.id !== 'upcoming_bookings');
  const upcoming = items.find((i) => i.id === 'upcoming_bookings');

  return (
    <>
      <View style={styles.tiles}>
        {tiles.map((item) => (
          <Pressable key={item.id} style={styles.tile} onPress={() => onOpen(item)} accessibilityRole="button">
            <Feather name={item.icon as FeatherName} size={16} color={colors.accent} />
            <Text style={styles.tileValue}>{tileValue(item)}</Text>
            <Text style={styles.tileLabel}>{item.title}</Text>
          </Pressable>
        ))}
      </View>

      {upcoming && (
        <View style={styles.upcoming}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{upcoming.title}</Text>
            <Pressable onPress={() => onOpen(upcoming)} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {upcoming.data.bookings.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming bookings</Text>
            </View>
          ) : (
            upcoming.data.bookings.map((b: { id: string; customerName: string | null; scheduledAt: string; status: string }) => (
              <Pressable key={b.id} style={styles.bookingRow} onPress={() => onOpen(upcoming)}>
                <Text style={styles.bookingCustomer} numberOfLines={1}>{b.customerName ?? 'Customer'}</Text>
                <Text style={styles.bookingMeta}>
                  {formatDateTime(b.scheduledAt)}{b.status === 'pending_payment' ? ' · awaiting payment' : ''}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: { fontSize: typography.size.sm, color: colors.textMuted },
  name: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text, marginTop: 2 },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.md },
  seeAll: { fontSize: typography.size.sm, color: colors.accent, fontWeight: typography.weight.semibold, marginBottom: spacing.md },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertText: { flex: 1, fontSize: typography.size.base, color: colors.text, fontWeight: typography.weight.medium },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  tile: {
    width: '47.8%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tileValue: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.xs },
  tileLabel: { fontSize: typography.size.sm, color: colors.textMuted },
  upcoming: { marginTop: spacing.sm, marginBottom: spacing.md },
  bookingRow: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingCustomer: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  bookingMeta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: {
    width: '30.5%',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text, textAlign: 'center' },
  rec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recSoon: { backgroundColor: colors.surface, borderStyle: 'dashed' },
  recIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  recText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  soonBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  soonText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  customise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  customiseText: { fontSize: typography.size.base, color: colors.accent, fontWeight: typography.weight.semibold },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted, textAlign: 'center' },
  errorBox: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  retry: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.background },
  retryText: { color: colors.accent, fontWeight: typography.weight.semibold },
});
