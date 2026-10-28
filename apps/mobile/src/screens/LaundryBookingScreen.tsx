import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import {
  DUVET_PRICE_KOBO,
  DUVET_SERVICE_NAME,
  calcLaundryOrder,
  formatNaira,
  washPriceKobo,
  washServiceName,
} from '../lib/laundry';
import { Button, Page, PageHeader, SectionTitle, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LaundryBooking'>;

// ── Drop-off: time windows ────────────────────────────────────────────────────
const TIME_WINDOWS = [
  { key: 'morning', label: 'Morning', time: '09:00', display: '9am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', time: '13:00', display: '1pm – 5pm' },
  { key: 'evening', label: 'Evening', time: '17:00', display: '5pm – 8pm' },
] as const;
type WindowKey = (typeof TIME_WINDOWS)[number]['key'];

// ── Self-service: specific hour slots ────────────────────────────────────────
const SELF_SERVICE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:00 ${ampm}`;
}

// ─────────────────────────────────────────────────────────────────────────────

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

function buildDropOffSlot(date: Date, windowKey: WindowKey): { iso: string; label: string } {
  const win = TIME_WINDOWS.find((w) => w.key === windowKey)!;
  const [h, m] = win.time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return { iso: d.toISOString(), label: '' };
}

function buildSelfServiceSlot(date: Date, hour: number): { iso: string; label: string } {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return { iso: d.toISOString(), label: '' };
}

function dayLabel(day: Date, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildSlotLabel(
  date: Date,
  dayIndex: number,
  serviceType: 'self_service' | 'drop_off',
  windowKey?: WindowKey,
  hour?: number,
): string {
  const dStr = dayLabel(date, dayIndex);
  if (serviceType === 'drop_off' && windowKey) {
    const win = TIME_WINDOWS.find((w) => w.key === windowKey)!;
    return `${dStr} • ${win.label} (${win.display})`;
  }
  if (serviceType === 'self_service' && hour !== undefined) {
    return `${dStr} • ${formatHour(hour)}`;
  }
  return dStr;
}

// ── Editable stepper ─────────────────────────────────────────────────────────
function Stepper({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  function commit(text: string) {
    const n = parseInt(text, 10);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setDraft(null);
  }

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Fewer"
      >
        <Feather name="minus" size={18} color={value <= min ? colors.disabled : colors.text} />
      </Pressable>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.stepValueWrap}>
        <TextInput
          ref={inputRef}
          style={styles.stepValue}
          value={draft !== null ? draft : String(value)}
          onFocus={() => setDraft(String(value))}
          onChangeText={setDraft}
          onBlur={() => commit(draft ?? String(value))}
          onSubmitEditing={() => commit(draft ?? String(value))}
          keyboardType="number-pad"
          selectTextOnFocus
          returnKeyType="done"
          accessibilityLabel="Number of duvets"
        />
      </Pressable>

      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="More"
      >
        <Feather name="plus" size={18} color={value >= max ? colors.disabled : colors.text} />
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function LaundryBookingScreen({ route, navigation }: Props) {
  const { vendor, serviceType } = route.params;
  const { colors } = useTheme();
  const styles = useStyles();
  const isDropOff = serviceType === 'drop_off';

  const [services, setServices] = useState<Service[] | null>(null);
  const [duvetEnabled, setDuvetEnabled] = useState(false);
  const [duvets, setDuvets] = useState(1);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Drop-off: window selection
  const [selectedWindow, setSelectedWindow] = useState<WindowKey | null>(null);
  // Self-service: specific hour selection
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const days = useMemo(() => nextNDays(21), []);

  useEffect(() => {
    listServices(vendor.id)
      .then(setServices)
      .catch(() => setServices([]));
  }, [vendor.id]);

  const washServiceId = services?.find((s) => s.name === washServiceName(serviceType))?.id ?? null;
  const duvetServiceId = services?.find((s) => s.name === DUVET_SERVICE_NAME)?.id ?? null;

  const effectiveDuvets = duvetEnabled ? duvets : 0;
  const order = calcLaundryOrder(effectiveDuvets, serviceType);

  const scheduleReady = isDropOff ? selectedWindow !== null : selectedHour !== null;
  const isReady = scheduleReady && services !== null && washServiceId !== null;

  function handleReview() {
    if (!isReady || !washServiceId) return;
    const serviceIds: string[] = [washServiceId];
    if (duvetEnabled && duvetServiceId) serviceIds.push(duvetServiceId);

    const day = days[selectedDayIndex];
    let slotISO: string;
    if (isDropOff && selectedWindow) {
      slotISO = buildDropOffSlot(day, selectedWindow).iso;
    } else {
      slotISO = buildSelfServiceSlot(day, selectedHour!).iso;
    }
    const slotLabel = buildSlotLabel(day, selectedDayIndex, serviceType, selectedWindow ?? undefined, selectedHour ?? undefined);

    navigation.navigate('LaundryCheckout', {
      vendor,
      serviceType,
      duvets: effectiveDuvets,
      serviceIds,
      slotISO,
      slotLabel,
    });
  }

  const washPrice = washPriceKobo(serviceType);

  return (
    <Page
      footer={
        <StickyFooter>
          {services === null ? (
            <ActivityIndicator color={colors.link} style={{ flex: 1, height: 56 }} />
          ) : (
            <Button
              label={isReady ? `Review order · ${formatNaira(order.totalKobo)}` : 'Pick a date and time'}
              icon={isReady ? 'arrow-right' : undefined}
              onPress={handleReview}
              disabled={!isReady}
              style={{ flex: 1 }}
            />
          )}
        </StickyFooter>
      }
    >
      <PageHeader onBack={() => navigation.goBack()} title="Laundry order" description={vendor.businessName} />

      {/* Wash: flat fee for the chosen service type, always included */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Your wash" />
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardTitle}>{washServiceName(serviceType)}</Text>
              <Text style={styles.cardSub}>Flat rate, included in every order</Text>
            </View>
            <Text style={styles.price}>{formatNaira(washPrice)}</Text>
          </View>
        </View>
      </View>

      {/* Duvets and bedding: optional add-on */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle title="Add duvets and bedding?" />
        <Pressable
          style={[styles.card, duvetEnabled && styles.cardOn]}
          onPress={() => setDuvetEnabled((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: duvetEnabled }}
        >
          <View style={styles.cardHead}>
            <View style={[styles.check, duvetEnabled && styles.checkOn]}>
              {duvetEnabled ? <Feather name="check" size={14} color={colors.onAccent} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardTitle}>Duvets and bedding</Text>
              <Text style={styles.cardSub}>{formatNaira(DUVET_PRICE_KOBO)} per duvet</Text>
            </View>
          </View>

          {duvetEnabled ? (
            <View style={styles.cardBody}>
              <View style={styles.stepperRow}>
                <Text style={[styles.cardSub, { flex: 1 }]}>Number of duvets</Text>
                <Stepper value={duvets} onChange={setDuvets} min={1} max={20} />
              </View>
              <Text style={styles.cardSub}>
                {duvets} duvet{duvets !== 1 ? 's' : ''}: {formatNaira(order.duvetSubtotalKobo)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionTitle title={isDropOff ? 'Drop-off date' : 'Date'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
          {days.map((day, i) => {
            const selected = i === selectedDayIndex;
            const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.toLocaleDateString('en-US', { weekday: 'short' });
            const num = day.toLocaleDateString('en-US', { day: 'numeric' });
            return (
              <Pressable
                key={i}
                style={[styles.dayChip, selected && styles.chipOn]}
                onPress={() => setSelectedDayIndex(i)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipSub, selected && styles.textOn]}>{label}</Text>
                <Text style={[styles.dayNum, selected && styles.textOn]}>{num}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isDropOff ? (
        <View style={{ gap: spacing.md }}>
          <SectionTitle title="Drop-off window" />
          <View style={styles.windowRow}>
            {TIME_WINDOWS.map((win) => {
              const selected = selectedWindow === win.key;
              return (
                <Pressable
                  key={win.key}
                  style={[styles.window, selected && styles.chipOn]}
                  onPress={() => setSelectedWindow(win.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected && styles.textOn]}>{win.label}</Text>
                  <Text style={[styles.chipSub, selected && styles.textOn]}>{win.display}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <SectionTitle title="Time" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
            {SELF_SERVICE_HOURS.map((h) => {
              const selected = selectedHour === h;
              return (
                <Pressable
                  key={h}
                  style={[styles.timeChip, selected && styles.chipOn]}
                  onPress={() => setSelectedHour(h)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected && styles.textOn]}>{formatHour(h)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18 },
  cardOn: { borderColor: colors.link, backgroundColor: colors.accentLight },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  cardBody: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  price: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  stepBtnDisabled: { borderColor: colors.border },
  stepValueWrap: { minWidth: 40, alignItems: 'center' },
  stepValue: { fontSize: 16, fontWeight: '700', color: colors.text, width: 44, padding: 0, textAlign: 'center', fontVariant: ['tabular-nums'] },

  bleed: { marginHorizontal: -GUTTER, flexGrow: 0 },
  chips: { paddingHorizontal: GUTTER, gap: 10 },
  dayChip: { minWidth: 72, height: 72, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayNum: { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  windowRow: { flexDirection: 'row', gap: 10 },
  window: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 2 },
  timeChip: { height: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipSub: { fontSize: 13, color: colors.textSecondary },
  textOn: { color: colors.onPrimary },
}));
