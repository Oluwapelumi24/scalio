import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  completeBooking,
  cancelBooking,
  markNoShow,
  formatNaira,
  formatDateTime,
  statusLabel,
  getFeedbackShare,
  whatsappUrl,
  type VendorBooking,
  type BookingStatus,
} from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending_payment: colors.warning,
  confirmed: colors.accent,
  completed: colors.accent,
  cancelled_by_customer: colors.accent,
  cancelled_by_vendor: colors.accent,
  no_show: colors.textMuted,
};

const STATUS_BG: Record<BookingStatus, string> = {
  pending_payment: colors.warningLight,
  confirmed: colors.accentLight,
  completed: colors.accentLight,
  cancelled_by_customer: colors.accentLight,
  cancelled_by_vendor: colors.accentLight,
  no_show: colors.surface,
};

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function BookingDetailScreen({ route, navigation }: Props) {
  const [booking, setBooking] = useState<VendorBooking>(route.params.booking);
  const [loading, setLoading] = useState<string | null>(null);

  const canAct = ['pending_payment', 'confirmed'].includes(booking.status);

  /** Sends the customer their rating link — on WhatsApp if we have their number, else the share sheet. */
  async function askForFeedback() {
    setLoading('feedback');
    try {
      const share = await getFeedbackShare(booking.id);
      if (share.submitted) {
        Alert.alert('Already rated', 'This customer has already rated the visit. See it under Settings → Customer feedback.');
        return;
      }
      if (share.phone) await Linking.openURL(whatsappUrl(share.phone, share.message));
      else await Share.share({ message: share.message });
    } catch (err) {
      Alert.alert('Could not get the feedback link', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function act(action: 'complete' | 'cancel' | 'no-show') {
    const label = action === 'complete' ? 'Mark complete' : action === 'cancel' ? 'Cancel booking' : 'Mark no-show';
    Alert.alert(
      label,
      action === 'cancel' ? 'The customer will be notified. This cannot be undone.' : 'Are you sure?',
      [
        { text: 'Dismiss', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'cancel' ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(action);
            try {
              let updated: VendorBooking;
              if (action === 'complete') updated = await completeBooking(booking.id);
              else if (action === 'cancel') updated = await cancelBooking(booking.id);
              else updated = await markNoShow(booking.id);
              setBooking(updated);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setLoading(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Booking detail</Text>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_BG[booking.status] }]}>
          <Text style={[styles.statusBannerText, { color: STATUS_COLOR[booking.status] }]}>{statusLabel(booking.status)}</Text>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <InfoRow icon="user" label="Name" value={booking.customer?.name ?? 'Unknown'} />
          <InfoRow icon="mail" label="Email" value={booking.customer?.email ?? '—'} />
        </View>

        {/* Appointment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment</Text>
          <InfoRow icon="calendar" label="Date & time" value={formatDateTime(booking.scheduledAt)} />
          <InfoRow icon="clock" label="Duration" value={`${booking.durationMinutes} minutes`} />
          <InfoRow icon="tag" label="Services" value={(booking.services ?? []).map((s) => s.name).join(', ')} />
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <InfoRow icon="credit-card" label="Total" value={formatNaira(booking.totalAmountKobo)} />
          <InfoRow icon="dollar-sign" label="Mode" value={booking.paymentMode.replace(/_/g, ' ')} />
        </View>

        {booking.status === 'completed' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Feedback</Text>
            <Text style={styles.feedbackText}>
              Customers with an email get a rating link automatically. Send it yourself on WhatsApp, or remind them.
            </Text>
            <Pressable style={[styles.feedbackBtn, loading === 'feedback' && { opacity: 0.6 }]} onPress={askForFeedback} disabled={loading !== null} accessibilityRole="button">
              <Feather name="star" size={16} color={colors.accent} />
              <Text style={styles.feedbackBtnText}>{loading === 'feedback' ? 'Getting link…' : 'Ask for feedback'}</Text>
            </Pressable>
          </View>
        )}

        {booking.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Actions */}
      {canAct && (
        <SafeAreaView edges={['bottom']} style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.completeBtn, loading ? styles.actionDisabled : {}]}
            onPress={() => void act('complete')}
            disabled={!!loading}
          >
            {loading === 'complete' ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={styles.actionBtnLabel}>Mark complete</Text>
              </>
            )}
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={[styles.actionBtn, styles.noShowBtn, loading ? styles.actionDisabled : {}]}
              onPress={() => void act('no-show')}
              disabled={!!loading}
            >
              {loading === 'no-show' ? <ActivityIndicator color={colors.warning} size="small" /> : (
                <>
                  <Feather name="user-x" size={16} color={colors.warning} />
                  <Text style={[styles.actionBtnLabel, { color: colors.warning }]}>No-show</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.cancelBtn, loading ? styles.actionDisabled : {}]}
              onPress={() => void act('cancel')}
              disabled={!!loading}
            >
              {loading === 'cancel' ? <ActivityIndicator color={colors.error} size="small" /> : (
                <>
                  <Feather name="x-circle" size={16} color={colors.error} />
                  <Text style={[styles.actionBtnLabel, { color: colors.error }]}>Cancel</Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackText: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 19 },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.pill, paddingVertical: spacing.md },
  feedbackBtnText: { color: colors.accent, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  root: { flex: 1, backgroundColor: colors.surface },
  headerSafe: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginTop: spacing.md, marginBottom: spacing.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.md },
  statusBanner: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statusBannerText: { fontSize: typography.size.md, fontWeight: typography.weight.bold },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel: { fontSize: typography.size.xs, color: colors.textMuted },
  infoValue: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.text, marginTop: 2 },
  notes: { fontSize: typography.size.base, color: colors.textSecondary, lineHeight: 22 },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  completeBtn: { backgroundColor: colors.accent },
  noShowBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.warning, backgroundColor: colors.warningLight },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.errorLight },
  secondaryRow: { flexDirection: 'row', gap: spacing.md },
  actionDisabled: { opacity: 0.5 },
  actionBtnLabel: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.white },
});
