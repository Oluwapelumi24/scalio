import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { formatNaira, formatTime, listBookings, statusLabel, type BookingStatus, type VendorBooking } from '../lib/api';
import { AddButton, EmptyState, PageHeader, PillTabs } from '../components/ui';
import { GUTTER, makeStyles, useTheme, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

type Filter = BookingStatus | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending_payment', label: 'Waiting for payment' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled_by_vendor', label: 'Cancelled' },
];

const STATUS_COLOR = (colors: Colors): Record<BookingStatus, string> => ({
  pending_payment: colors.warning,
  confirmed: colors.link,
  completed: colors.success,
  cancelled_by_customer: colors.error,
  cancelled_by_vendor: colors.error,
  no_show: colors.textMuted,
});

function dayHeading(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Every booking as a list, grouped by day — the calendar's other view. */
export function BookingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
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

  const sections: { title: string; data: VendorBooking[] }[] = [];
  for (const b of bookings) {
    const title = dayHeading(b.scheduledAt);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(b);
    else sections.push({ title, data: [b] });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <SectionList
        sections={loading ? [] : sections}
        keyExtractor={(b) => b.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}
        ListHeaderComponent={
          <View style={{ gap: 22, marginBottom: 8 }}>
            <PageHeader
              title="Bookings"
              description="Every booking, newest first."
              onBack={() => navigation.goBack()}
              actions={<AddButton label="New" onPress={() => navigation.navigate('NewBooking')} />}
            />
            <PillTabs options={FILTERS} value={filter} onChange={setFilter} />
            {loading ? <ActivityIndicator color={colors.link} style={{ marginTop: 24 }} /> : null}
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('BookingDetail', { booking: item })}
            accessibilityRole="button"
          >
            <View style={[styles.bar, { backgroundColor: STATUS_COLOR(colors)[item.status] }]} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.time}>{formatTime(item.scheduledAt)} · {item.durationMinutes} min</Text>
              <Text style={styles.name} numberOfLines={1}>{item.customer?.name ?? 'Client'}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {(item.services ?? []).map((s) => s.name).join(', ')}
                {item.staff ? ` · with ${item.staff.name.split(' ')[0]}` : ''}
              </Text>
              <Text style={[styles.status, { color: STATUS_COLOR(colors)[item.status] }]}>{statusLabel(item.status)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text style={styles.price}>{formatNaira(item.totalAmountKobo)}</Text>
              <Feather name="chevron-right" size={20} color={colors.text} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="calendar"
              title={filter === 'all' ? 'No bookings yet' : 'Nothing here'}
              body={filter === 'all' ? 'Share your booking link, or add a booking yourself.' : 'No bookings match this filter.'}
              action={filter === 'all' ? 'New booking' : undefined}
              onAction={() => navigation.navigate('NewBooking')}
            />
          )
        }
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: GUTTER, paddingBottom: 48 },
  day: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 26, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 14 },
  bar: { width: 4, borderRadius: 2 },
  time: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  name: { fontSize: 18, fontWeight: '600', color: colors.text },
  sub: { fontSize: 15, color: colors.textSecondary },
  status: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
}));
