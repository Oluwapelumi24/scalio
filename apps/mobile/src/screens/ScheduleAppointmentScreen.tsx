import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, getAvailability, requestOtp } from '../lib/api';
import { getCurrentUser } from '../lib/session';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleAppointment'>;

const PAYMENT_MODE_PRIORITY = {
  pay_on_arrival: 0,
  deposit: 1,
  full_prepayment: 2,
} as const;

/**
 * The client decides `paymentMode`/`amountDueKobo` (the backend just records
 * what it's told). Selected services may carry different modes — e.g. one
 * service requires a deposit, another is pay-on-arrival — so we take the most
 * demanding mode across the selection and sum what's actually due upfront for
 * each: full price for `full_prepayment`, the deposit cut for `deposit`,
 * nothing for `pay_on_arrival`.
 */
function resolvePaymentDetails(services: Service[]): {
  paymentMode: Service['paymentMode'];
  amountDueKobo: number;
} {
  let paymentMode: Service['paymentMode'] = 'pay_on_arrival';
  let amountDueKobo = 0;

  for (const service of services) {
    if (PAYMENT_MODE_PRIORITY[service.paymentMode] > PAYMENT_MODE_PRIORITY[paymentMode]) {
      paymentMode = service.paymentMode;
    }
    if (service.paymentMode === 'full_prepayment') {
      amountDueKobo += service.priceKobo;
    } else if (service.paymentMode === 'deposit') {
      amountDueKobo += Math.round((service.priceKobo * (service.depositPercent ?? 0)) / 100);
    }
  }

  return { paymentMode, amountDueKobo };
}

const OTP_CODE_LENGTH = 6;

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    days.push(day);
  }
  return days;
}

function dayLabel(date: Date): { weekday: string; dayNumber: string } {
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNumber: date.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeLabel(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ScheduleAppointmentScreen({ route, navigation }: Props) {
  const { vendorId, services } = route.params;
  const serviceIds = useMemo(() => services.map((service) => service.id), [services]);
  const days = useMemo(() => nextNDays(30), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[] | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PRD §4.1 step 7: a verified one-time code gates booking creation. We send
  // it to the signed-up user's email once they've picked a slot, then collect
  // the code inline before submitting the booking.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset the previous day's results synchronously while rendering the new
  // day, rather than via setState-in-effect (which would commit a stale frame
  // first) — this is React's documented pattern for "adjusting state when a
  // prop changes": https://react.dev/learn/you-might-not-need-an-effect
  const [lastFetchedDayIndex, setLastFetchedDayIndex] = useState<number | null>(null);
  if (lastFetchedDayIndex !== selectedDayIndex) {
    setLastFetchedDayIndex(selectedDayIndex);
    setSlots(null);
    setSelectedSlot(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    getAvailability(vendorId, toISODate(days[selectedDayIndex]), serviceIds)
      .then((result) => {
        if (cancelled) return;
        setSlots(result.slots);
        setDurationMinutes(result.durationMinutes);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load available times.');
      });

    return () => {
      cancelled = true;
    };
  }, [vendorId, serviceIds, days, selectedDayIndex]);

  function requireSignedInUser() {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Please sign in', 'Create an account before booking an appointment.');
      navigation.navigate('SignUp');
      return null;
    }
    return user;
  }

  async function handleRequestCode() {
    if (!selectedSlot || durationMinutes === null || requestingCode) return;

    const user = requireSignedInUser();
    if (!user) return;

    setRequestingCode(true);
    try {
      await requestOtp(user.email);
      setOtpSent(true);
      setOtpCode('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not send verification code', message);
    } finally {
      setRequestingCode(false);
    }
  }

  async function handleConfirm() {
    if (!selectedSlot || durationMinutes === null || otpCode.trim().length !== OTP_CODE_LENGTH || submitting) return;

    const user = requireSignedInUser();
    if (!user) return;

    const { paymentMode, amountDueKobo } = resolvePaymentDetails(services);

    setSubmitting(true);
    try {
      const result = await createBooking({
        vendorId,
        userId: user.id,
        email: user.email,
        otpCode: otpCode.trim(),
        serviceIds,
        scheduledAt: selectedSlot,
        durationMinutes,
        paymentMode,
        amountDueKobo,
      });
      navigation.navigate('BookingConfirmation', { booking: result.booking, payment: result.payment });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try a different time.';
      Alert.alert('Could not book this slot', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick a date and time</Text>

      <FlatList
        horizontal
        data={days}
        keyExtractor={(item) => item.toISOString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayList}
        renderItem={({ item, index }) => {
          const { weekday, dayNumber } = dayLabel(item);
          const selected = index === selectedDayIndex;
          return (
            <Pressable
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => setSelectedDayIndex(index)}
            >
              <Text style={[styles.dayWeekday, selected && styles.dayTextSelected]}>{weekday}</Text>
              <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>{dayNumber}</Text>
            </Pressable>
          );
        }}
      />

      <Text style={styles.sectionLabel}>Available times</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && !slots && <ActivityIndicator style={styles.loader} />}
      {!error && slots && slots.length === 0 && (
        <Text style={styles.empty}>No times available this day — try another date.</Text>
      )}
      <View style={styles.timeGrid}>
        {(slots ?? []).map((slot) => {
          const selected = slot === selectedSlot;
          return (
            <Pressable
              key={slot}
              style={[styles.timeChip, selected && styles.timeChipSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.timeLabel, selected && styles.dayTextSelected]}>{timeLabel(slot)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        {otpSent && (
          <View style={styles.otpField}>
            <Text style={styles.label}>Enter the 6-digit code we emailed you</Text>
            <TextInput
              style={styles.otpInput}
              value={otpCode}
              onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, OTP_CODE_LENGTH))}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={OTP_CODE_LENGTH}
            />
          </View>
        )}

        {!otpSent ? (
          <Pressable
            style={[styles.cta, (!selectedSlot || requestingCode) && styles.ctaDisabled]}
            onPress={() => void handleRequestCode()}
            disabled={!selectedSlot || requestingCode}
          >
            {requestingCode ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.ctaLabel}>{selectedSlot ? 'Send verification code' : 'Pick a time'}</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.cta, (otpCode.trim().length !== OTP_CODE_LENGTH || submitting) && styles.ctaDisabled]}
            onPress={() => void handleConfirm()}
            disabled={otpCode.trim().length !== OTP_CODE_LENGTH || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.ctaLabel}>Verify &amp; book</Text>
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
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 20,
  },
  dayList: {
    paddingBottom: 8,
  },
  dayChip: {
    width: 56,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eeeeee',
    alignItems: 'center',
    marginRight: 10,
  },
  dayChipSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  dayWeekday: {
    fontSize: 12,
    color: '#777777',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginTop: 2,
  },
  dayTextSelected: {
    color: '#ffffff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 28,
    marginBottom: 12,
  },
  loader: {
    marginTop: 8,
  },
  error: {
    color: '#b00020',
    fontSize: 14,
  },
  empty: {
    color: '#777777',
    fontSize: 14,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
    marginRight: 10,
    marginBottom: 10,
  },
  timeChipSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  footer: {
    marginTop: 'auto',
  },
  otpField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 4,
    color: '#111111',
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#cccccc',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
