import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  getBooking,
  getNotifications,
  markNotificationsRead,
  type VendorNotification,
  type VendorNotificationType,
} from '../lib/api';
import { EmptyState, Page, PageHeader, TipCard, type FeatherName } from '../components/ui';
import { makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const ICON: Record<VendorNotificationType, FeatherName> = {
  booking_new: 'calendar',
  booking_cancelled: 'x-circle',
  payment_received: 'credit-card',
  review: 'star',
  inbox_handoff: 'message-circle',
};

/** "Just now", "5m", "3h", "Yesterday", then "4 Nov". */
function ago(iso: string, now = Date.now()): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function NotificationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [items, setItems] = useState<VendorNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getNotifications();
      setItems(res.items);
      setError(null);
      // Opening the list counts as seeing them; the dots stay for this visit.
      if (res.unread > 0) void markNotificationsRead().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
      setItems((prev) => prev ?? []);
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function open(n: VendorNotification) {
    if (n.conversationId) {
      navigation.navigate('InboxChat', { conversationId: n.conversationId });
      return;
    }
    if (n.type === 'review') {
      navigation.navigate('Feedback');
      return;
    }
    if (n.bookingId) {
      try {
        navigation.navigate('BookingDetail', { booking: await getBooking(n.bookingId) });
      } catch (err) {
        Alert.alert('Could not open booking', err instanceof Error ? err.message : 'Please try again.');
      }
    }
  }

  return (
    <Page refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}>
      <PageHeader title="Notifications" description="New bookings, cancellations, payments, ratings and chats that need you." onBack={() => navigation.goBack()} />

      {error ? <TipCard icon="alert-circle" title="Could not load notifications" body={error} /> : null}

      {!items ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.accent} />
      ) : items.length === 0 && !error ? (
        <EmptyState icon="bell" title="Nothing yet" body="When a client books, cancels, pays or rates a visit, it shows up here." />
      ) : (
        <View>
          {items.map((n) => {
            const tappable = !!(n.bookingId || n.conversationId || n.type === 'review');
            return (
              <Pressable
                key={n.id}
                onPress={tappable ? () => void open(n) : undefined}
                disabled={!tappable}
                accessibilityRole={tappable ? 'button' : undefined}
                accessibilityLabel={`${n.unread ? 'New. ' : ''}${n.title}. ${n.body}. ${ago(n.createdAt)}`}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.icon, n.type === 'booking_cancelled' && styles.iconAlert]}>
                  <Feather name={ICON[n.type]} size={18} color={n.type === 'booking_cancelled' ? colors.error : colors.link} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.titleLine}>
                    <Text style={[styles.title, n.unread && styles.titleUnread]} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.time}>{ago(n.createdAt)}</Text>
                  </View>
                  <Text style={styles.body}>{n.body}</Text>
                </View>
                {n.unread ? <View style={styles.dot} accessibilityElementsHidden /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  iconAlert: { backgroundColor: colors.errorLight },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  titleUnread: { fontWeight: '700' },
  time: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.link, marginTop: 6 },
}));
