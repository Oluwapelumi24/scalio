import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, getAvailability } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor } from '../lib/categories';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';
import { BackButton } from '../components/BackButton';

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
  const { vendor, services } = route.params;
  const serviceIds = useMemo(() => services.map((service) => service.id), [services]);
  const days = useMemo(() => nextNDays(30), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[] | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    getAvailability(vendor.id, toISODate(days[selectedDayIndex]), serviceIds)
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
  }, [vendor.id, serviceIds, days, selectedDayIndex]);

  function requireSignedInUser() {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Please sign in', 'Create an account before booking an appointment.');
      navigation.navigate('SignUp');
      return null;
    }
    return user;
  }

  async function handleConfirm() {
    if (!selectedSlot || durationMinutes === null || submitting) return;

    const user = requireSignedInUser();
    if (!user) return;

    setSubmitting(true);
    try {
      const result = await createBooking({
        vendorId: vendor.id,
        userId: user.id,
        serviceIds,
        scheduledAt: selectedSlot,
        durationMinutes,
      });
      navigation.navigate('BookingConfirmation', { booking: result.booking, vendor, services });
      // pay_on_arrival bookings land on BookingSuccess after BookingConfirmation; prepay
      // bookings go through Paystack checkout first then navigate there on return.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try a different time.';
      Alert.alert('Could not book this slot', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.vendorHeader}>
        <View style={[styles.vendorIconBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
          <Feather name={getCategoryMeta(vendor.category).icon} size={14} color={colors.white} />
        </View>
        <Text style={styles.vendorName}>{vendor.businessName}</Text>
      </View>

      <Text style={styles.title}>Pick a date and time</Text>

      <FlatList
        horizontal
        data={days}
        keyExtractor={(item) => item.toISOString()}
        showsHorizontalScrollIndicator={false}
        style={styles.dayListContainer}
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
      {/* No max-height/scroll here — a vendor with many slots could overflow.
          Defer wrapping in a ScrollView unless QA on a small device shows it. */}
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
        <Pressable
          style={[styles.cta, (!selectedSlot || submitting) && styles.ctaDisabled]}
          onPress={() => void handleConfirm()}
          disabled={!selectedSlot || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaLabel}>{selectedSlot ? 'Book appointment' : 'Pick a time'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vendorIconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  vendorName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: 20,
  },
  dayListContainer: {
    flexGrow: 0,
    flexShrink: 0,
    height: 72,
  },
  dayList: {
    paddingBottom: spacing.sm,
  },
  dayChip: {
    width: 56,
    height: 64,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayWeekday: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  dayNumber: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginTop: 2,
  },
  dayTextSelected: {
    color: colors.white,
  },
  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    marginTop: 28,
    marginBottom: spacing.md,
  },
  loader: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.size.base,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.size.base,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: spacing.sm,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    marginBottom: 10,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  footer: {
    marginTop: 'auto',
  },
  cta: {
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
});
