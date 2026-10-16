import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import {
  getTodaySummary,
  listBookings,
  formatDateTime,
  formatNaira,
  statusLabel,
  type VendorBooking,
  type BookingStatus,
  type TodaySummary,
} from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const FILTERS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled_by_vendor', label: 'Cancelled' },
];

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending_payment: colors.warning,
  confirmed: colors.accent,
  completed: colors.success,
  cancelled_by_customer: colors.cancelled,
  cancelled_by_vendor: colors.cancelled,
  no_show: colors.textMuted,
};

export function BookingsScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [today, setToday] = useState<TodaySummary | null>(null);

  const load = useCallback(async () => {
    // Today's figures don't depend on the filter; a failure just hides them.
    getTodaySummary().then(setToday).catch(() => setToday(null));
    try {
      const data = await listBookings(filter === 'all' ? undefined : filter);
      setBookings(data.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); void load(); }, [load]);

  function renderItem({ item }: { item: VendorBooking }) {
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer?.name ?? 'Unknown customer'}
            </Text>
            <Text style={styles.services} numberOfLines={1}>
              {(item.services ?? []).map((s) => s.name).join(', ')}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDateTime(item.scheduledAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.durationMinutes} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="credit-card" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatNaira(item.totalAmountKobo)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.statusLabel, { color: STATUS_COLOR[item.status] }]}>
            {statusLabel(item.status)}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      {today && (
        <View style={styles.today} accessibilityLabel="Today">
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{today.bookings}</Text>
            <Text style={styles.todayLabel}>Today's bookings</Text>
          </View>
          {today.salesKobo != null && (
            <View style={[styles.todayStat, styles.todayDivider]}>
              <Text style={styles.todayValue}>₦{(today.salesKobo / 100).toLocaleString('en-NG')}</Text>
              <Text style={styles.todayLabel}>Today's sales</Text>
            </View>
          )}
        </View>
      )}

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} bookings</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Today's figures, moved here from Home — set in the Home screen's type.
  today: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  todayStat: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: 18, gap: 2 },
  todayDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  todayValue: { fontWeight: '800', fontSize: 28, letterSpacing: -0.6, color: colors.text, fontVariant: ['tabular-nums'] },
  todayLabel: { fontWeight: '500', fontSize: 12, color: colors.textMuted },
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  filterLabelActive: { color: colors.white },
  list: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  customerName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  services: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: typography.size.sm, color: colors.textMuted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  statusLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.lg },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
});
