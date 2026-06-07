import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, getAvailability } from '../lib/api';
import { getCurrentUser } from '../lib/session';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleAppointment'>;

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
  const { vendorId, serviceIds } = route.params;
  const days = useMemo(() => nextNDays(30), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [slots, setSlots] = useState<string[] | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setSelectedSlot(null);
    setError(null);

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

  async function handleConfirm() {
    if (!selectedSlot || durationMinutes === null) return;

    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Please sign in', 'Create an account before booking an appointment.');
      navigation.navigate('SignUp');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        vendorId,
        userId: user.id,
        serviceIds,
        scheduledAt: selectedSlot,
        durationMinutes,
      });
      navigation.navigate('BookingConfirmation', { bookingId: booking.id });
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

      <Pressable
        style={[styles.cta, (!selectedSlot || submitting) && styles.ctaDisabled]}
        onPress={handleConfirm}
        disabled={!selectedSlot || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.ctaLabel}>{selectedSlot ? 'Confirm booking' : 'Pick a time'}</Text>
        )}
      </Pressable>
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
  cta: {
    marginTop: 'auto',
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
