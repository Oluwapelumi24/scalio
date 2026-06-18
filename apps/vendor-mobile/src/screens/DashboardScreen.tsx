import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  formatNaira,
  formatDateTime,
  listBookings,
  statusLabel,
  type VendorBooking,
  type BookingStatus,
} from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: colors.warning,
  confirmed: colors.accent,
  completed: colors.accent,
  cancelled: colors.cancelled,
  no_show: colors.textMuted,
};

const STATUS_BG: Record<BookingStatus, string> = {
  pending: colors.warningLight,
  confirmed: colors.accentLight,
  completed: colors.accentLight,
  cancelled: colors.cancelledLight,
  no_show: colors.surface,
};

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: keyof typeof Feather.glyphMap; accent?: string }) {
  return (
    <View style={[styles.statCard, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}]}>
      <Feather name={icon} size={18} color={accent ?? colors.textMuted} style={{ marginBottom: spacing.sm }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BookingRow({ booking, onPress }: { booking: VendorBooking; onPress: () => void }) {
  return (
    <Pressable style={styles.bookingRow} onPress={onPress}>
      <View style={styles.bookingLeft}>
        <Text style={styles.bookingCustomer} numberOfLines={1}>
          {booking.customer?.name ?? 'Unknown'}
        </Text>
        <Text style={styles.bookingMeta} numberOfLines={1}>
          {(booking.services ?? []).map((s) => s.name).join(', ')} · {formatDateTime(booking.scheduledAt)}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[booking.status] }]}>
        <Text style={[styles.statusText, { color: STATUS_COLOR[booking.status] }]}>
          {statusLabel(booking.status)}
        </Text>
      </View>
    </Pressable>
  );
}

export function DashboardScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const session = getSession();

  const load = useCallback(async () => {
    try {
      const data = await listBookings();
      setBookings(data);
    } catch {
      // silently fail on dashboard
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const today = new Date().toDateString();
  const todayBookings = bookings.filter((b) => new Date(b.scheduledAt).toDateString() === today);
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const todayRevenue = todayBookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalAmountKobo, 0);
  const upcoming = bookings
    .filter((b) => ['pending', 'confirmed'].includes(b.status) && new Date(b.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {greeting()}</Text>
          <Text style={styles.name}>{session?.name ?? 'Vendor'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(session?.name ?? 'V').charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.xl }} color={colors.accent} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Today's bookings" value={String(todayBookings.length)} icon="calendar" accent={colors.accent} />
            <StatCard label="Pending approval" value={String(pending)} icon="clock" accent={pending > 0 ? colors.warning : colors.textMuted} />
            <StatCard label="Today's revenue" value={formatNaira(todayRevenue)} icon="trending-up" accent={colors.success} />
          </View>

          {/* Upcoming */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming bookings</Text>
              <Pressable onPress={() => navigation.navigate('Bookings')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            {upcoming.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="calendar" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>No upcoming bookings</Text>
              </View>
            ) : (
              upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onPress={() => navigation.navigate('BookingDetail', { booking: b })}
                />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
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
  },
  greeting: { fontSize: typography.size.sm, color: colors.textMuted },
  name: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text, marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  seeAll: { fontSize: typography.size.sm, color: colors.accent, fontWeight: typography.weight.semibold },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingLeft: { flex: 1, marginRight: spacing.md },
  bookingCustomer: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  bookingMeta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
});
