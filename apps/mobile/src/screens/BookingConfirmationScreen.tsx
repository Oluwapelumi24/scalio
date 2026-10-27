import { useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { initiateBookingPayment, type PaymentCheckout } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageSource } from '../lib/categories';
import { amountForPaymentMode, PAYMENT_MODE_PRIORITY, resolveMinimumPaymentMode } from '../lib/payments';
import { NO_SHOW_FEE_NOTICE, PAY_ON_ARRIVAL_CAVEAT } from '../lib/policy';
import { Button, Page, PageHeader, SectionTitle, StickyFooter, TipCard } from '../components/ui';
import { makeStyles, spacing, useTheme } from '../theme';

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
  const { colors } = useTheme();
  const styles = useStyles();
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
    <View style={styles.vendor}>
      <View>
        <Image source={getVendorImageSource(vendor)} style={styles.vendorImage} />
        <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
          <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.vendorName}>{vendor.businessName}</Text>
        <Text style={styles.vendorSub}>Booking reference {reference(booking.id)}</Text>
      </View>
    </View>
  );

  if (payment) {
    return (
      <Page
        footer={
          <StickyFooter>
            <View style={{ flex: 1, gap: spacing.md }}>
              <Button label="Pay now" onPress={() => void handlePayNow(payment.authorizationUrl)} />
              <Button
                label="I’ll pay later"
                variant="secondary"
                onPress={() => navigation.navigate('BookingSuccess', { booking, vendor })}
              />
            </View>
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={() => navigation.goBack()}
          title="Complete your payment"
          description={`Pay ${formatNaira(booking.amountDueKobo)} with Paystack to confirm your booking.`}
        />
        {vendorHeader}
        <TipCard icon="clock" title="Your slot is held for 10 minutes" body={NO_SHOW_FEE_NOTICE} />
      </Page>
    );
  }

  return (
    <Page
      footer={
        <StickyFooter>
          {effectiveMode === 'pay_on_arrival' ? (
            <Button
              label="Done"
              onPress={() => navigation.navigate('BookingSuccess', { booking, vendor })}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              label="Continue to payment"
              onPress={() => void handleContinueToPayment()}
              loading={submitting}
              style={{ flex: 1 }}
            />
          )}
        </StickyFooter>
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        eyebrow={
          <View style={styles.doneIcon}>
            <Feather name="check" size={26} color={colors.success} />
          </View>
        }
        title="You’re booked"
        description="Your appointment is confirmed. We’ll also send a confirmation to your email."
      />
      {vendorHeader}

      <View style={{ gap: spacing.md }}>
        <SectionTitle title="How would you like to pay?" />
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
            subtitle = `Pay ${formatNaira(amount)} now, ${formatNaira(remainder)} at the venue`;
          } else {
            title = 'Pay in full now';
            subtitle = 'With Paystack';
          }
          return (
            <Pressable
              key={mode}
              style={[styles.row, selected && styles.rowOn]}
              onPress={() => setChosenMode(mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.radio, selected && styles.radioOn]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowSub}>{subtitle}</Text>
              </View>
              <Text style={styles.rowPrice}>{formatNaira(amount)}</Text>
            </Pressable>
          );
        })}
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  vendor: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  vendorImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surface },
  categoryBadge: {
    position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
  },
  vendorName: { fontSize: 15, fontWeight: '600', color: colors.text },
  vendorSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontVariant: ['tabular-nums'] },
  doneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.link, backgroundColor: colors.accentLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderStrong },
  radioOn: { borderColor: colors.accent, borderWidth: 7 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  rowPrice: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
}));
