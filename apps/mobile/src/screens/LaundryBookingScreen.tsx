import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import {
  BASKET_PRICE_KOBO,
  CLOTHING_SERVICE_NAME,
  DUVET_PRICE_KOBO,
  DUVET_SERVICE_NAME,
  calcLaundryOrder,
  clothingToBaskets,
  formatNaira,
} from '../lib/laundry';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LaundryBooking'>;

const TIME_WINDOWS = [
  { key: 'morning', label: 'Morning', time: '09:00', display: '9am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', time: '13:00', display: '1pm – 5pm' },
  { key: 'evening', label: 'Evening', time: '17:00', display: '5pm – 8pm' },
] as const;

type WindowKey = (typeof TIME_WINDOWS)[number]['key'];

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function buildSlotISO(date: Date, windowKey: WindowKey): string {
  const win = TIME_WINDOWS.find((w) => w.key === windowKey)!;
  const [h, m] = win.time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function buildSlotLabel(date: Date, dayIndex: number, windowKey: WindowKey): string {
  const win = TIME_WINDOWS.find((w) => w.key === windowKey)!;
  let dateStr: string;
  if (dayIndex === 0) dateStr = 'Today';
  else if (dayIndex === 1) dateStr = 'Tomorrow';
  else dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dateStr} • ${win.label} (${win.display})`;
}

function Stepper({
  value,
  onDecrement,
  onIncrement,
  min = 1,
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDecrement}
        disabled={value <= min}
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
      >
        <Text style={[styles.stepIcon, value <= min && styles.stepIconDisabled]}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={onIncrement} style={styles.stepBtn}>
        <Text style={styles.stepIcon}>+</Text>
      </Pressable>
    </View>
  );
}

export function LaundryBookingScreen({ route, navigation }: Props) {
  const { vendor } = route.params;

  const [services, setServices] = useState<Service[] | null>(null);
  const [clothingEnabled, setClothingEnabled] = useState(false);
  const [duvetEnabled, setDuvetEnabled] = useState(false);
  const [clothingItems, setClothingItems] = useState(20);
  const [duvets, setDuvets] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState<WindowKey | null>(null);

  const days = useMemo(() => nextNDays(7), []);

  useEffect(() => {
    listServices(vendor.id)
      .then(setServices)
      .catch(() => setServices([]));
  }, [vendor.id]);

  const clothingServiceId = services?.find((s) => s.name === CLOTHING_SERVICE_NAME)?.id ?? null;
  const duvetServiceId = services?.find((s) => s.name === DUVET_SERVICE_NAME)?.id ?? null;

  const effectiveClothing = clothingEnabled ? clothingItems : 0;
  const effectiveDuvets = duvetEnabled ? duvets : 0;
  const order = calcLaundryOrder(effectiveClothing, effectiveDuvets);

  const isReady =
    (clothingEnabled || duvetEnabled) &&
    selectedWindow !== null &&
    services !== null;

  function handleReview() {
    if (!isReady || !selectedWindow) return;
    const serviceIds: string[] = [];
    if (clothingEnabled && clothingServiceId) serviceIds.push(clothingServiceId);
    if (duvetEnabled && duvetServiceId) serviceIds.push(duvetServiceId);

    navigation.navigate('LaundryCheckout', {
      vendor,
      clothingItems: effectiveClothing,
      duvets: effectiveDuvets,
      serviceIds,
      slotISO: buildSlotISO(days[selectedDayIndex], selectedWindow),
      slotLabel: buildSlotLabel(days[selectedDayIndex], selectedDayIndex, selectedWindow),
    });
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.screenTitle}>Laundry order</Text>
        <Text style={styles.vendorName}>{vendor.businessName}</Text>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* What needs washing */}
        <Text style={styles.sectionLabel}>What needs washing?</Text>

        {/* Option A: Clothing */}
        <Pressable
          style={[styles.optionCard, clothingEnabled && styles.optionCardSelected]}
          onPress={() => setClothingEnabled((v) => !v)}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.checkbox, clothingEnabled && styles.checkboxSelected]}>
              {clothingEnabled && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Clothing & fabrics</Text>
              <Text style={styles.optionMeta}>{formatNaira(BASKET_PRICE_KOBO)} per basket · 20 items = 1 basket</Text>
            </View>
          </View>

          {clothingEnabled && (
            <View style={styles.optionBody}>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Number of clothing items</Text>
                <Stepper
                  value={clothingItems}
                  min={1}
                  onDecrement={() => setClothingItems((v) => Math.max(1, v - 1))}
                  onIncrement={() => setClothingItems((v) => Math.min(200, v + 1))}
                />
              </View>
              <View style={styles.basketPreview}>
                <Feather name="package" size={13} color={colors.textMuted} />
                <Text style={styles.basketPreviewText}>
                  {clothingItems} item{clothingItems !== 1 ? 's' : ''} → {clothingToBaskets(clothingItems)} basket{clothingToBaskets(clothingItems) !== 1 ? 's' : ''} → {formatNaira(order.clothingSubtotalKobo)}
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* Option B: Duvets */}
        <Pressable
          style={[styles.optionCard, duvetEnabled && styles.optionCardSelected]}
          onPress={() => setDuvetEnabled((v) => !v)}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.checkbox, duvetEnabled && styles.checkboxSelected]}>
              {duvetEnabled && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Duvets & bedding</Text>
              <Text style={styles.optionMeta}>{formatNaira(DUVET_PRICE_KOBO)} per duvet</Text>
            </View>
          </View>

          {duvetEnabled && (
            <View style={styles.optionBody}>
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Number of duvets</Text>
                <Stepper
                  value={duvets}
                  min={1}
                  onDecrement={() => setDuvets((v) => Math.max(1, v - 1))}
                  onIncrement={() => setDuvets((v) => Math.min(20, v + 1))}
                />
              </View>
              <View style={styles.basketPreview}>
                <Feather name="package" size={13} color={colors.textMuted} />
                <Text style={styles.basketPreviewText}>
                  {duvets} duvet{duvets !== 1 ? 's' : ''} → {formatNaira(order.duvetSubtotalKobo)}
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* Drop-off time */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Drop-off date</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPills}>
          {days.map((day, i) => {
            const selected = i === selectedDayIndex;
            const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.toLocaleDateString('en-US', { weekday: 'short' });
            const num = day.toLocaleDateString('en-US', { day: 'numeric' });
            return (
              <Pressable
                key={i}
                style={[styles.dayPill, selected && styles.dayPillSelected]}
                onPress={() => setSelectedDayIndex(i)}
              >
                <Text style={[styles.dayPillWeekday, selected && styles.dayPillTextSelected]}>{label}</Text>
                <Text style={[styles.dayPillNum, selected && styles.dayPillTextSelected]}>{num}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Drop-off window</Text>

        <View style={styles.windowRow}>
          {TIME_WINDOWS.map((win) => {
            const selected = selectedWindow === win.key;
            return (
              <Pressable
                key={win.key}
                style={[styles.windowPill, selected && styles.windowPillSelected]}
                onPress={() => setSelectedWindow(win.key)}
              >
                <Text style={[styles.windowLabel, selected && styles.windowLabelSelected]}>{win.label}</Text>
                <Text style={[styles.windowDisplay, selected && styles.windowDisplaySelected]}>{win.display}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA bar */}
      <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
        {services === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Pressable
            style={[styles.cta, !isReady && styles.ctaDisabled]}
            disabled={!isReady}
            onPress={handleReview}
          >
            {(clothingEnabled || duvetEnabled) && order.totalKobo > 0 ? (
              <View style={styles.ctaInner}>
                <Text style={styles.ctaTotal}>{formatNaira(order.totalKobo)}</Text>
                <Text style={styles.ctaLabel}>Review order</Text>
                <Feather name="arrow-right" size={18} color="#ffffff" />
              </View>
            ) : (
              <Text style={styles.ctaLabel}>Select a service to continue</Text>
            )}
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  vendorName: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: typography.weight.bold,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  optionMeta: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  optionBody: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    borderColor: colors.disabled,
  },
  stepIcon: {
    fontSize: 20,
    color: colors.primary,
    lineHeight: 24,
  },
  stepIconDisabled: {
    color: colors.disabled,
  },
  stepValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    minWidth: 32,
    textAlign: 'center',
  },
  basketPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  basketPreviewText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  dayPills: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dayPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 64,
  },
  dayPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayPillWeekday: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
  },
  dayPillNum: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginTop: 2,
  },
  dayPillTextSelected: {
    color: '#ffffff',
  },
  windowRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  windowPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  windowPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  windowLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  windowLabelSelected: {
    color: '#ffffff',
  },
  windowDisplay: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  windowDisplaySelected: {
    color: 'rgba(255,255,255,0.75)',
  },
  ctaBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaTotal: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
  },
  ctaLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
  },
});
