import { Linking, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

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
  const { booking, payment } = route.params;

  if (payment) {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.badgePending]}>
          <Text style={styles.badgeMark}>₦</Text>
        </View>

        <Text style={styles.title}>Almost there — complete your payment</Text>
        <Text style={styles.subtitle}>
          We&apos;re holding your slot for the next 10 minutes while you pay{' '}
          {formatNaira(booking.amountDueKobo)} via Paystack to confirm it.
        </Text>
        <Text style={styles.reference}>Booking reference: {reference(booking.id)}</Text>

        <Pressable style={styles.cta} onPress={() => void handlePayNow(payment.authorizationUrl)}>
          <Text style={styles.ctaLabel}>Pay now</Text>
        </Pressable>
        <Pressable style={styles.secondaryCta} onPress={() => navigation.popToTop()}>
          <Text style={styles.secondaryCtaLabel}>I&apos;ll pay later</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeMark}>✓</Text>
      </View>

      <Text style={styles.title}>You&apos;re booked!</Text>
      <Text style={styles.subtitle}>
        Your appointment is confirmed — pay when you arrive. We&apos;ll also send a confirmation to your
        email.
      </Text>
      <Text style={styles.reference}>Booking reference: {reference(booking.id)}</Text>

      <Pressable style={styles.cta} onPress={() => navigation.popToTop()}>
        <Text style={styles.ctaLabel}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgePending: {
    backgroundColor: '#b8860b',
  },
  badgeMark: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  reference: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 40,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCta: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryCtaLabel: {
    color: '#777777',
    fontSize: 15,
    fontWeight: '600',
  },
});
