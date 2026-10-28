import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Booking } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, initiateBookingPayment, type PaymentCheckout } from '../lib/api';
import { calcLaundryOrder, formatNaira, laundryDurationMinutes, washServiceName } from '../lib/laundry';
import { getCurrentUser } from '../lib/session';
import { Button, Divider, Page, PageHeader, SectionTitle, StickyFooter, TipCard } from '../components/ui';
import { makeStyles, spacing, useTheme } from '../theme';

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
    subtitle: 'Secure your order with Paystack',
  },
];

function reference(bookingId: string): string {
  return bookingId.slice(0, 8).toUpperCase();
}

export function LaundryCheckoutScreen({ route, navigation }: Props) {
  const { vendor, serviceType, duvets, serviceIds, slotISO, slotLabel } = route.params;
  const isDropOff = serviceType === 'drop_off';
  const { colors } = useTheme();
  const styles = useStyles();

  const [paymentMode, setPaymentMode] = useState<PayMode>('pay_on_arrival');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<PaymentCheckout | null>(null);

  const order = useMemo(() => calcLaundryOrder(duvets, serviceType), [duvets, serviceType]);
  const durationMinutes = useMemo(() => laundryDurationMinutes(duvets), [duvets]);

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

  // Payment started: send them to Paystack
  if (payment && booking) {
    return (
      <Page
        footer={
          <StickyFooter>
            <View style={{ flex: 1, gap: spacing.md }}>
              <Button label="Pay now" onPress={() => void handlePayNow()} />
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
          description={`Pay ${formatNaira(order.totalKobo)} with Paystack to confirm your laundry order.`}
        />
        <TipCard icon="clock" title="Your slot is held for 10 minutes" body={`Order reference ${reference(booking.id)}`} />
      </Page>
    );
  }

  return (
    <Page
      footer={
        <StickyFooter>
          <Button
            label={paymentMode === 'pay_on_arrival' ? 'Confirm order' : `Pay ${formatNaira(order.totalKobo)}`}
            onPress={() => void handleConfirm()}
            loading={submitting}
            style={{ flex: 1 }}
          />
        </StickyFooter>
      }
    >
      <PageHeader onBack={() => navigation.goBack()} title="Review order" description={vendor.businessName} />

      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Order summary" />
        <View style={styles.card}>
          <View style={styles.line}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.lineName}>{washServiceName(serviceType)}</Text>
              <Text style={styles.lineSub}>Flat rate</Text>
            </View>
            <Text style={styles.linePrice}>{formatNaira(order.washSubtotalKobo)}</Text>
          </View>
          {duvets > 0 ? (
            <>
              <Divider inset={20} />
              <View style={styles.line}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.lineName}>Duvets and bedding</Text>
                  <Text style={styles.lineSub}>{duvets} duvet{duvets !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.linePrice}>{formatNaira(order.duvetSubtotalKobo)}</Text>
              </View>
            </>
          ) : null}
          <Divider />
          <View style={styles.line}>
            <Text style={[styles.lineName, { flex: 1, fontWeight: '700' }]}>Total</Text>
            <Text style={styles.total}>{formatNaira(order.totalKobo)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.slot]}>
        <Feather name="calendar" size={22} color={colors.link} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.lineSub}>{isDropOff ? 'Drop-off time' : 'Appointment time'}</Text>
          <Text style={styles.lineName}>{slotLabel}</Text>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionTitle title="How would you like to pay?" />
        {PAYMENT_OPTIONS.map((opt) => {
          const selected = paymentMode === opt.mode;
          return (
            <Pressable
              key={opt.mode}
              style={[styles.payRow, selected && styles.payRowOn]}
              onPress={() => setPaymentMode(opt.mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.radio, selected && styles.radioOn]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.lineName}>{opt.title}</Text>
                <Text style={styles.lineSub}>{opt.subtitle}</Text>
              </View>
              <Text style={styles.linePrice}>{formatNaira(order.totalKobo)}</Text>
            </Pressable>
          );
        })}
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, backgroundColor: colors.card },
  line: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 },
  lineName: { fontSize: 15, fontWeight: '500', color: colors.text },
  lineSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  linePrice: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  total: { fontSize: 17, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  payRowOn: { borderColor: colors.link, backgroundColor: colors.accentLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderStrong },
  radioOn: { borderColor: colors.accent, borderWidth: 7 },
}));
