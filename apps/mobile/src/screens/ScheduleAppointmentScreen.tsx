import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createBooking, getAvailability } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor } from '../lib/categories';
import { getCurrentUser } from '../lib/session';
import { Button, EmptyState, Page, PageHeader, SectionTitle, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

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
  const { colors } = useTheme();
  const styles = useStyles();
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
    <Page
      footer={
        <StickyFooter>
          <Button
            label={selectedSlot ? 'Book appointment' : 'Pick a time'}
            onPress={() => void handleConfirm()}
            loading={submitting}
            disabled={!selectedSlot}
            style={{ flex: 1 }}
          />
        </StickyFooter>
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        eyebrow={
          <View style={styles.vendor}>
            <View style={[styles.vendorBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
              <Feather name={getCategoryMeta(vendor.category).icon} size={13} color={colors.white} />
            </View>
            <Text style={styles.vendorName}>{vendor.businessName}</Text>
          </View>
        }
        title="Pick a date and time"
      />

      <FlatList
        horizontal
        data={days}
        keyExtractor={(item) => item.toISOString()}
        showsHorizontalScrollIndicator={false}
        style={styles.days}
        contentContainerStyle={styles.dayList}
        renderItem={({ item, index }) => {
          const { weekday, dayNumber } = dayLabel(item);
          const selected = index === selectedDayIndex;
          return (
            <Pressable
              style={[styles.dayChip, selected && styles.chipOn]}
              onPress={() => setSelectedDayIndex(index)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.toDateString()}
            >
              <Text style={[styles.dayWeekday, selected && styles.textOn]}>{weekday}</Text>
              <Text style={[styles.dayNumber, selected && styles.textOn]}>{dayNumber}</Text>
            </Pressable>
          );
        }}
      />

      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Available times" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!error && !slots ? <ActivityIndicator color={colors.link} style={{ marginTop: spacing.sm }} /> : null}
        {!error && slots && slots.length === 0 ? (
          <EmptyState icon="clock" title="No free times this day" body="Try another date." />
        ) : null}
        <View style={styles.timeGrid}>
          {(slots ?? []).map((slot) => {
            const selected = slot === selectedSlot;
            return (
              <Pressable
                key={slot}
                style={[styles.timeChip, selected && styles.chipOn]}
                onPress={() => setSelectedSlot(slot)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.timeLabel, selected && styles.textOn]}>{timeLabel(slot)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  vendor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vendorBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vendorName: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  days: { flexGrow: 0, marginHorizontal: -GUTTER },
  dayList: { paddingHorizontal: GUTTER, gap: 10 },
  dayChip: {
    width: 60, height: 72, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  textOn: { color: colors.onPrimary },
  dayWeekday: { fontSize: 13, color: colors.textSecondary },
  dayNumber: { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  error: { fontSize: 14, color: colors.error },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    height: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  timeLabel: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
}));
