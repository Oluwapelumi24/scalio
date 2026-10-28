import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabScreenProps } from '../navigation/types';
import type { BookingWithVendor } from '../lib/api';
import { listBookings } from '../lib/api';
import { getVendorImageSource } from '../lib/categories';
import { getCurrentUser } from '../lib/session';
import { Button, EmptyState, Page, PageHeader, UnderlineTabs, type FeatherName } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme, type Colors } from '../theme';

type Props = MainTabScreenProps<'Appointments'>;
type Tab = 'upcoming' | 'completed' | 'cancelled';

const UPCOMING_STATUSES = new Set(['pending_payment', 'confirmed']);
const COMPLETED_STATUSES = new Set(['completed']);
const CANCELLED_STATUSES = new Set(['cancelled_by_customer', 'cancelled_by_vendor', 'no_show']);

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_vendor: 'Cancelled by business',
  no_show: 'No-show',
};

// Same status colours as the vendor app's bookings list.
const STATUS_COLOR = (colors: Colors): Record<string, string> => ({
  pending_payment: colors.warning,
  confirmed: colors.link,
  completed: colors.success,
  cancelled_by_customer: colors.error,
  cancelled_by_vendor: colors.error,
  no_show: colors.textMuted,
});

const EMPTY: Record<Tab, { icon: FeatherName; title: string; body?: string }> = {
  upcoming: { icon: 'calendar', title: 'No upcoming bookings', body: 'Book one from the home screen.' },
  completed: { icon: 'check-circle', title: 'No completed bookings yet' },
  cancelled: { icon: 'x-circle', title: 'No cancelled bookings' },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function BookingCard({
  item,
  showRebook,
  onRebook,
}: {
  item: BookingWithVendor;
  showRebook?: boolean;
  onRebook?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const statusColor = STATUS_COLOR(colors)[item.booking.status] ?? colors.textMuted;
  return (
    <View style={styles.card}>
      <Image source={getVendorImageSource(item.vendor)} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.vendor.businessName}</Text>
        <Text style={styles.cardDate}>{formatDateTime(item.booking.scheduledAt)}</Text>
        <Text style={[styles.status, { color: statusColor }]}>
          {STATUS_LABELS[item.booking.status] ?? item.booking.status}
        </Text>
      </View>
      {showRebook ? <Button label="Rebook" onPress={onRebook ?? (() => {})} variant="secondary" size="sm" /> : null}
    </View>
  );
}

export function AppointmentsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<BookingWithVendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  useFocusEffect(
    useCallback(() => {
      const user = getCurrentUser();
      setSignedIn(!!user);
      if (!user) return;
      let cancelled = false;
      setError(null);
      listBookings(user.id)
        .then((result) => { if (!cancelled) setBookings(result); })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your appointments.');
        });
      return () => { cancelled = true; };
    }, []),
  );

  const tabData = useMemo(() => {
    if (!bookings) return [];
    if (activeTab === 'upcoming') return bookings.filter((b) => UPCOMING_STATUSES.has(b.booking.status));
    if (activeTab === 'completed') return bookings.filter((b) => COMPLETED_STATUSES.has(b.booking.status));
    return bookings.filter((b) => CANCELLED_STATUSES.has(b.booking.status));
  }, [bookings, activeTab]);

  if (!signedIn) {
    return (
      <Page>
        <PageHeader title="Bookings" description="Your upcoming visits and booking history." />
        <EmptyState
          icon="calendar"
          title="Sign in to see your bookings"
          body="Your appointments and history will show here."
          action="Sign in"
          onAction={() => navigation.navigate('SignIn')}
        />
      </Page>
    );
  }

  const empty = EMPTY[activeTab];

  return (
    <View style={styles.root}>
      <FlatList
        data={tabData}
        keyExtractor={(item) => item.booking.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Bookings" count={bookings ? tabData.length : undefined} description="Your upcoming visits and booking history." />
            <UnderlineTabs<Tab>
              options={[
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
              ]}
              value={activeTab}
              onChange={setActiveTab}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          bookings === null && !error ? (
            <ActivityIndicator color={colors.link} style={{ marginTop: spacing.xl }} />
          ) : (
            <EmptyState icon={empty.icon} title={empty.title} body={empty.body} />
          )
        }
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            showRebook={activeTab === 'completed' || activeTab === 'cancelled'}
            onRebook={() => navigation.navigate('VendorProfile', { vendor: item.vendor })}
          />
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: GUTTER, paddingBottom: 48, gap: spacing.md },
  header: { gap: 20, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingRight: 16,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.card,
  },
  cardImage: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.surface },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardDate: { fontSize: 13, color: colors.textSecondary },
  status: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 14, color: colors.error },
}));
