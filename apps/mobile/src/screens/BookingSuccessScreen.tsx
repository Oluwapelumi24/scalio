import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { typography, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSuccess'>;

export function BookingSuccessScreen({ route, navigation }: Props) {
  const { booking, vendor } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.checkCircle}>
          <Feather name="check" size={44} color="#ffffff" />
        </View>

        <Text style={styles.headline}>Appointment{'\n'}booked!</Text>
        <Text style={styles.sub}>
          Your appointment at{' '}
          <Text style={styles.subBold}>{vendor.businessName}</Text> has been confirmed. We'll send a reminder before your visit.
        </Text>

        <View style={styles.refBadge}>
          <Text style={styles.refLabel}>Booking reference</Text>
          <Text style={styles.refValue}>{booking.id.slice(0, 8).toUpperCase()}</Text>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.primaryBtnLabel}>View my bookings</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.secondaryBtnLabel}>Continue exploring</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headline: {
    fontSize: 36,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: spacing.lg,
  },
  sub: {
    fontSize: typography.size.lg,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xxl,
  },
  subBold: {
    color: '#ffffff',
    fontWeight: typography.weight.semibold,
  },
  refBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  refLabel: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  refValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
    letterSpacing: 2,
  },
  actions: {
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnLabel: {
    color: '#0f0c29',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
