import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { initiateBookingPayment, type PaymentCheckout } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl } from '../lib/categories';
import { amountForPaymentMode, PAYMENT_MODE_PRIORITY, resolveMinimumPaymentMode } from '../lib/payments';
import { NO_SHOW_FEE_NOTICE, PAY_ON_ARRIVAL_CAVEAT } from '../lib/policy';
import { BackButton } from '../components/BackButton';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

const PAYMENT_MODES = Object.keys(PAYMENT_MODE_PRIORITY) as Service['paymentMode'][];

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function reference(bookingId: string): string {
  return bookingId.slice(0, 8).toUpperCase();
}

async function handlePayNow(authorizationUrl: string) {
  try {
    await Linking.openURL(authorizationUrl);
  } catch {
    Alert.alert('Could not open checkout', 'Please try again in a moment.');
  }
}

export function BookingConfirmationScreen({ route, navigation }: Props) {
  const { booking: initialBooking, vendor, services } = route.params;
  const [booking, setBooking] = useState(initialBooking);
  const [payment, setPayment] = useState<PaymentCheckout | null>(null);
  const [chosenMode, setChosenMode] = useState<Service['paymentMode'] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const minMode = useMemo(() => resolveMinimumPaymentMode(services), [services]);

  const availableModes = useMemo(
    () => [...PAYMENT_MODES].sort((a, b) => PAYMENT_MODE_PRIORITY[a] - PAYMENT_MODE_PRIORITY[b]),
    [],
  );

  const effectiveMode = chosenMode ?? minMode;

  async function handleContinueToPayment() {
    if (effectiveMode === 'pay_on_arrival' || submitting) return;

    setSubmitting(true);
    try {
      const result = await initiateBookingPayment(
        booking.id,
        effectiveMode,
        amountForPaymentMode(services, effectiveMode),
      );
      setBooking(result.booking);
      setPayment(result.payment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again in a moment.';
      Alert.alert('Could not start payment', message);
    } finally {
      setSubmitting(false);
    }
  }

  const vendorHeader = (
    <View style={styles.vendorHeader}>
      <View style={styles.vendorImageWrap}>
        <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.vendorImage} />
        <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
          <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
        </View>
      </View>
      <View style={styles.vendorHeaderCopy}>
        <Text style={styles.vendorName}>{vendor.businessName}</Text>
        <Text style={styles.vendorCategory}>{vendor.category}</Text>
      </View>
    </View>
  );

  if (payment) {
    return (
      <View style={styles.container}>
        <View style={styles.backRow}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        {vendorHeader}
        <View style={styles.confirmationGroup}>
          <View style={[styles.badge, styles.badgePending]}>
            <Feather name="credit-card" size={28} color={colors.white} />
          </View>

          <Text style={styles.title}>Almost there — complete your payment</Text>

          <View style={styles.timerNotice}>
            <Feather name="clock" size={16} color={colors.pending} />
            <Text style={styles.timerNoticeText}>Holding your slot for 10 minutes</Text>
          </View>
          <Text style={styles.subtitle}>
            Pay {formatNaira(booking.amountDueKobo)} via Paystack to confirm your booking.
          </Text>
          <Text style={styles.reference}>Booking reference: {reference(booking.id)}</Text>

          <Text style={styles.caveat}>{NO_SHOW_FEE_NOTICE}</Text>

          <Pressable style={styles.cta} onPress={() => void handlePayNow(payment.authorizationUrl)}>
            <Text style={styles.ctaLabel}>Pay now</Text>
          </Pressable>
          <Pressable style={styles.secondaryCta} onPress={() => navigation.navigate('BookingSuccess', { booking, vendor })}>
            <Text style={styles.secondaryCtaLabel}>I&apos;ll pay later</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      {vendorHeader}
      <View style={styles.confirmationGroup}>
        <View style={styles.badge}>
          <Feather name="check-circle" size={28} color={colors.white} />
        </View>

        <Text style={styles.title}>You&apos;re booked!</Text>
        <Text style={styles.subtitle}>
          Your appointment is confirmed — pay when you arrive. We&apos;ll also send a confirmation to your
          email.
        </Text>
        <Text style={styles.reference}>Booking reference: {reference(booking.id)}</Text>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionLabel}>How would you like to pay?</Text>
          {availableModes.map((mode) => {
            const selected = mode === effectiveMode;
            const amount = amountForPaymentMode(services, mode);
            let title: string;
            let subtitle: string;
            if (mode === 'pay_on_arrival') {
              title = 'Pay at the venue';
              subtitle = PAY_ON_ARRIVAL_CAVEAT;
            } else if (mode === 'deposit') {
              title = 'Pay part now';
              const remainder = amountForPaymentMode(services, 'full_prepayment') - amount;
              subtitle = `Pay ${formatNaira(amount)} now, ${formatNaira(remainder)} due at the venue`;
            } else {
              title = 'Pay in full now';
              subtitle = 'via Paystack now';
            }
            return (
              <Pressable
                key={mode}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => setChosenMode(mode)}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
                <Text style={styles.rowPrice}>{formatNaira(amount)}</Text>
              </Pressable>
            );
          })}
        </View>

        {effectiveMode === 'pay_on_arrival' && <Text style={styles.caveat}>{PAY_ON_ARRIVAL_CAVEAT}</Text>}

        {effectiveMode === 'pay_on_arrival' ? (
          <Pressable style={styles.cta} onPress={() => navigation.navigate('BookingSuccess', { booking, vendor })}>
            <Text style={styles.ctaLabel}>Done</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.cta, submitting && styles.ctaDisabled]}
            onPress={() => void handleContinueToPayment()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaLabel}>Continue to payment</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backRow: {
    paddingTop: 96,
    paddingHorizontal: spacing.xl,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  vendorImageWrap: {
    width: 56,
    height: 56,
    marginRight: spacing.md,
    position: 'relative',
  },
  vendorImage: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  categoryBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  vendorHeaderCopy: {
    flex: 1,
  },
  vendorName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  vendorCategory: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  confirmationGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  badgePending: {
    backgroundColor: colors.pending,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  timerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  timerNoticeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.pending,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  reference: {
    fontSize: typography.size.sm,
    color: colors.textFaint,
    marginBottom: spacing.lg,
  },
  paymentSection: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  paymentSectionLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#fafafa',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  rowCopy: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  rowSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  caveat: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaLabel: {
    color: colors.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  secondaryCta: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryCtaLabel: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
