import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

export function BookingConfirmationScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeMark}>✓</Text>
      </View>

      <Text style={styles.title}>You&apos;re booked!</Text>
      <Text style={styles.subtitle}>
        We&apos;ve held your slot for the next 10 minutes while it&apos;s confirmed. You&apos;ll get an SMS
        and in-app confirmation shortly.
      </Text>
      <Text style={styles.reference}>Booking reference: {bookingId.slice(0, 8).toUpperCase()}</Text>

      <Pressable
        style={styles.cta}
        onPress={() => navigation.popToTop()}
      >
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
});
