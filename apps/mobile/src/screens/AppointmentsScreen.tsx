import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabScreenProps } from '../navigation/types';
import type { BookingWithVendor } from '../lib/api';
import { listBookings } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl } from '../lib/categories';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

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

const STATUS_COLORS: Record<string, string> = {
  pending_payment: colors.pending,
  confirmed: '#22c55e',
  completed: colors.textMuted,
  cancelled_by_customer: colors.error,
  cancelled_by_vendor: colors.error,
  no_show: colors.error,
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
  const statusColor = STATUS_COLORS[item.booking.status] ?? colors.textMuted;
  return (
    <View style={styles.card}>
      <Image source={{ uri: getVendorImageUrl(item.vendor) }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.vendor.businessName}</Text>
        <Text style={styles.cardDate}>{formatDateTime(item.booking.scheduledAt)}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {STATUS_LABELS[item.booking.status] ?? item.booking.status}
          </Text>
        </View>
      </View>
      {showRebook && (
        <Pressable style={styles.rebookBtn} onPress={onRebook}>
          <Text style={styles.rebookLabel}>Rebook</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyState({ tab, onSignIn }: { tab: Tab; onSignIn: () => void }) {
  const config: Record<Tab, { icon: keyof typeof Feather.glyphMap; message: string }> = {
    upcoming: { icon: 'calendar', message: 'No upcoming appointments.\nBook one from the home screen.' },
    completed: { icon: 'check-circle', message: 'No completed appointments yet.' },
    cancelled: { icon: 'x-circle', message: 'No cancelled appointments.' },
  };
  const { icon, message } = config[tab];
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={48} color={colors.disabled} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function AppointmentsScreen({ navigation }: Props) {
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
      <View style={styles.container}>
        <Text style={styles.title}>My bookings</Text>
        <View style={styles.guestState}>
          <Feather name="calendar" size={48} color={colors.disabled} />
          <Text style={styles.emptyText}>Sign in to see your bookings and appointment history.</Text>
          <Pressable style={styles.signInBtn} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signInBtnLabel}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My bookings</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['upcoming', 'completed', 'cancelled'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={tabData}
        keyExtractor={(item) => item.booking.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          bookings === null && !error ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} />
          ) : (
            <EmptyState tab={activeTab} onSignIn={() => navigation.navigate('SignUp')} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: '#f5f5f5',
    borderRadius: radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: 88,
    height: 88,
    backgroundColor: colors.border,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: 3,
  },
  cardName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  cardDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  rebookBtn: {
    marginRight: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rebookLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  signInBtnLabel: {
    color: '#ffffff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.xl,
  },
});
