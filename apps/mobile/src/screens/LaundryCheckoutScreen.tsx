import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Booking } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, initiateBookingPayment, type PaymentCheckout } from '../lib/api';
import { calcLaundryOrder, formatNaira, laundryDurationMinutes } from '../lib/laundry';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LaundryCheckout'>;

type PayMode = 'pay_on_arrival' | 'full_prepayment';

const PAYMENT_OPTIONS: { mode: PayMode; title: string; subtitle: string }[] = [
  {
    mode: 'pay_on_arrival',
    title: 'Pay at pickup',
    subtitle: 'Pay when you collect your laundry',
  },
  {
    mode: 'full_prepayment',
    title: 'Pay in full now',
    subtitle: 'Secure your order via Paystack',
  },
];

function reference(bookingId: string): string {
  return bookingId.slice(0, 8).toUpperCase();
}

export function LaundryCheckoutScreen({ route, navigation }: Props) {
  const { vendor, clothingItems, duvets, serviceIds, slotISO, slotLabel } = route.params;

  const [paymentMode, setPaymentMode] = useState<PayMode>('pay_on_arrival');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<PaymentCheckout | null>(null);

  const order = useMemo(() => calcLaundryOrder(clothingItems, duvets), [clothingItems, duvets]);
  const durationMinutes = useMemo(() => laundryDurationMinutes(clothingItems, duvets), [clothingItems, duvets]);

  async function handleConfirm() {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to place an order.');
      return;
    }

    setSubmitting(true);
    try {
      const { booking: newBooking } = await createBooking({
        vendorId: vendor.id,
        userId: user.id,
        serviceIds,
        scheduledAt: slotISO,
        durationMinutes,
      });
      setBooking(newBooking);

      if (paymentMode === 'pay_on_arrival') {
        navigation.navigate('BookingSuccess', { booking: newBooking, vendor });
      } else {
        const { payment: p } = await initiateBookingPayment(newBooking.id, 'full_prepayment', order.totalKobo);
        setPayment(p);
      }
    } catch (err) {
      Alert.alert('Could not confirm order', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayNow() {
    if (!payment) return;
    try {
      await Linking.openURL(payment.authorizationUrl);
    } catch {
      Alert.alert('Could not open payment', 'Please try again.');
    }
  }

  // Payment initiated — show payment pending state
  if (payment && booking) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </Pressable>
        </SafeAreaView>

        <View style={styles.paymentPendingBody}>
          <View style={[styles.statusBadge, { backgroundColor: '#b8860b' }]}>
            <Feather name="credit-card" size={28} color="#ffffff" />
          </View>
          <Text style={styles.pendingTitle}>Complete your payment</Text>
          <View style={styles.timerRow}>
            <Feather name="clock" size={14} color={colors.pending} />
            <Text style={styles.timerText}>Slot held for 10 minutes</Text>
          </View>
          <Text style={styles.pendingSubtitle}>
            Pay {formatNaira(order.totalKobo)} via Paystack to confirm your laundry order.
          </Text>
          <Text style={styles.refText}>Order reference: {reference(booking.id)}</Text>

          <Pressable style={styles.payNowBtn} onPress={() => void handlePayNow()}>
            <Text style={styles.payNowLabel}>Pay now</Text>
          </Pressable>
          <Pressable
            style={styles.payLaterBtn}
            onPress={() => navigation.navigate('BookingSuccess', { booking, vendor })}
          >
            <Text style={styles.payLaterLabel}>I&apos;ll pay later</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.screenTitle}>Review order</Text>
        <Text style={styles.vendorName}>{vendor.businessName}</Text>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Order breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order summary</Text>

          {clothingItems > 0 && (
            <View style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemName}>Clothing & fabrics</Text>
                <Text style={styles.lineItemMeta}>
                  {clothingItems} item{clothingItems !== 1 ? 's' : ''} → {order.baskets} basket{order.baskets !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.lineItemPrice}>{formatNaira(order.clothingSubtotalKobo)}</Text>
            </View>
          )}

          {duvets > 0 && (
            <View style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemName}>Duvets & bedding</Text>
                <Text style={styles.lineItemMeta}>
                  {duvets} duvet{duvets !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.lineItemPrice}>{formatNaira(order.duvetSubtotalKobo)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatNaira(order.totalKobo)}</Text>
          </View>
        </View>

        {/* Drop-off time */}
        <View style={styles.card}>
          <View style={styles.slotRow}>
            <View style={styles.slotIcon}>
              <Feather name="calendar" size={16} color={colors.primary} />
            </View>
            <View style={styles.slotInfo}>
              <Text style={styles.slotTitle}>Drop-off time</Text>
              <Text style={styles.slotValue}>{slotLabel}</Text>
            </View>
          </View>
        </View>

        {/* Payment mode */}
        <Text style={styles.sectionLabel}>How would you like to pay?</Text>

        {PAYMENT_OPTIONS.map((opt) => {
          const selected = paymentMode === opt.mode;
          return (
            <Pressable
              key={opt.mode}
              style={[styles.paymentRow, selected && styles.paymentRowSelected]}
              onPress={() => setPaymentMode(opt.mode)}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{opt.title}</Text>
                <Text style={styles.paymentSubtitle}>{opt.subtitle}</Text>
              </View>
              <Text style={styles.paymentAmount}>{formatNaira(order.totalKobo)}</Text>
            </Pressable>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm CTA */}
      <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
        <Pressable
          style={[styles.cta, submitting && styles.ctaDisabled]}
          onPress={() => void handleConfirm()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.ctaLabel}>
              {paymentMode === 'pay_on_arrival' ? 'Confirm order' : `Pay ${formatNaira(order.totalKobo)}`}
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerSafe: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  vendorName: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  lineItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  lineItemName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  lineItemMeta: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  lineItemPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  totalLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  totalAmount: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInfo: {
    flex: 1,
  },
  slotTitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  slotValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  paymentRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#fafafa',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  paymentSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  ctaBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
  },
  // Payment pending state
  paymentPendingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  statusBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pendingTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timerText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.pending,
  },
  pendingSubtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  refText: {
    fontSize: typography.size.sm,
    color: colors.textFaint,
    marginBottom: spacing.xl,
  },
  payNowBtn: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payNowLabel: {
    color: '#ffffff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  payLaterBtn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  payLaterLabel: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
