import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  cancelBooking,
  completeBooking,
  formatNaira,
  formatTime,
  getFeedbackShare,
  markNoShow,
  statusLabel,
  whatsappUrl,
  type BookingStatus,
  type VendorBooking,
} from '../lib/api';
import { Avatar, Button, Divider, IconButton, Page, PageHeader, StickyFooter, TipCard } from '../components/ui';
import { GUTTER, makeStyles, useTheme, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const STATUS_COLOR = (colors: Colors): Record<BookingStatus, string> => ({
  pending_payment: colors.warning,
  confirmed: colors.link,
  completed: colors.success,
  cancelled_by_customer: colors.error,
  cancelled_by_vendor: colors.error,
  no_show: colors.textMuted,
});

const PAYMENT: Record<string, string> = {
  pay_on_arrival: 'Pays at the appointment',
  deposit: 'Deposit',
  full_prepayment: 'Paid in full online',
};

/** One appointment: who, what, when, and what to do with it. */
export function BookingDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState<VendorBooking>(route.params.booking);
  const [busy, setBusy] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  const canAct = ['pending_payment', 'confirmed'].includes(booking.status);
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.durationMinutes * 60_000);

  /** Sends the client their rating link — on WhatsApp if we have their number, else the share sheet. */
  async function askForFeedback() {
    setBusy('feedback');
    try {
      const share = await getFeedbackShare(booking.id);
      if (share.submitted) {
        Alert.alert('Already rated', 'This client has already rated the visit. See it in More → Marketing → Customer feedback.');
        return;
      }
      if (share.phone) await Linking.openURL(whatsappUrl(share.phone, share.message));
      else await Share.share({ message: share.message });
    } catch (err) {
      Alert.alert('Could not get the feedback link', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function act(action: 'complete' | 'cancel' | 'no-show') {
    setMenu(false);
    const title = action === 'complete' ? 'Mark as complete?' : action === 'cancel' ? 'Cancel this booking?' : 'Mark as a no-show?';
    const body =
      action === 'cancel' ? 'The client will be told. This cannot be undone.'
      : action === 'no-show' ? 'This counts against the client’s record.'
      : 'This adds the visit and its value to the client’s history.';
    Alert.alert(title, body, [
      { text: 'Not now', style: 'cancel' },
      {
        text: action === 'complete' ? 'Mark complete' : action === 'cancel' ? 'Cancel booking' : 'Mark no-show',
        style: action === 'complete' ? 'default' : 'destructive',
        onPress: async () => {
          setBusy(action);
          try {
            const updated =
              action === 'complete' ? await completeBooking(booking.id)
              : action === 'cancel' ? await cancelBooking(booking.id)
              : await markNoShow(booking.id);
            setBooking({ ...booking, ...updated, staff: updated.staff ?? booking.staff });
          } catch (err) {
            Alert.alert('Could not update the booking', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }

  return (
    <Page
      footer={
        canAct ? (
          <StickyFooter>
            <Button label="Mark complete" icon="check" onPress={() => act('complete')} loading={busy === 'complete'} disabled={!!busy} style={{ flex: 1 }} />
          </StickyFooter>
        ) : undefined
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        actions={canAct ? <IconButton icon="more-vertical" label="More actions" onPress={() => setMenu(true)} outlined /> : undefined}
        eyebrow={<Text style={[styles.status, { color: STATUS_COLOR(colors)[booking.status] }]}>{statusLabel(booking.status)}</Text>}
        title={start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + formatTime(booking.scheduledAt)}
        description={`${formatTime(booking.scheduledAt)} – ${formatTime(end.toISOString())} · ${booking.durationMinutes} min${booking.staff ? ` · with ${booking.staff.name}` : ''}`}
      />

      {/* Client */}
      <Pressable
        style={({ pressed }) => [styles.client, pressed && { opacity: 0.7 }]}
        onPress={() => booking.customer && navigation.navigate('CustomerDetail', { customerId: booking.customer.id })}
        disabled={!booking.customer}
        accessibilityRole="button"
      >
        <Avatar name={booking.customer?.name ?? 'Client'} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.clientName}>{booking.customer?.name ?? 'Client'}</Text>
          {booking.customer?.email ? <Text style={styles.sub} numberOfLines={1}>{booking.customer.email}</Text> : null}
        </View>
        {booking.customer ? <Feather name="chevron-right" size={20} color={colors.text} /> : null}
      </Pressable>

      {/* Services and total */}
      <View style={{ gap: 4 }}>
        <Text style={styles.section}>Services</Text>
        {(booking.services ?? []).map((s) => (
          <View key={s.id} style={styles.service}>
            <View style={styles.bar} />
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.amount}>{formatNaira(s.priceKobo)}</Text>
          </View>
        ))}
        <Divider />
        <View style={styles.totalRow}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{formatNaira(booking.totalAmountKobo)}</Text>
        </View>
        <Text style={styles.sub}>{PAYMENT[booking.paymentMode] ?? booking.paymentMode.replace(/_/g, ' ')}</Text>
      </View>

      {booking.status === 'completed' ? (
        <TipCard
          icon="star"
          title="How did it go?"
          body="Clients with an email get a rating link automatically. You can also send it yourself on WhatsApp."
          actionLabel={busy === 'feedback' ? 'Getting link…' : 'Ask for feedback'}
          onAction={() => void askForFeedback()}
        />
      ) : null}

      {booking.notes ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.section}>Notes</Text>
          <Text style={styles.notes}>{booking.notes}</Text>
        </View>
      ) : null}

      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenu(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{booking.customer?.name ?? 'Booking'}</Text>
          <Pressable style={styles.sheetRow} onPress={() => act('no-show')} accessibilityRole="button">
            <Feather name="user-x" size={22} color={colors.text} />
            <Text style={styles.sheetLabel}>Mark as no-show</Text>
          </Pressable>
          <Pressable style={styles.sheetRow} onPress={() => act('cancel')} accessibilityRole="button">
            <Feather name="x-circle" size={22} color={colors.error} />
            <Text style={[styles.sheetLabel, { color: colors.error }]}>Cancel booking</Text>
          </Pressable>
        </View>
      </Modal>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  status: { fontSize: 16, fontWeight: '700' },
  client: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  clientName: { fontSize: 19, fontWeight: '700', color: colors.text },
  sub: { fontSize: 15, color: colors.textSecondary },
  section: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  service: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.accent },
  serviceName: { flex: 1, fontSize: 17, color: colors.text },
  amount: { fontSize: 17, color: colors.text, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  total: { fontSize: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  notes: { fontSize: 16, lineHeight: 23, color: colors.textSecondary },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: GUTTER, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 14 },
  sheetTitle: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 6 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  sheetLabel: { fontSize: 18, color: colors.text },
}));
