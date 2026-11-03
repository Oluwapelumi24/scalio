import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  createBooking,
  formatNaira,
  getBookingSettings,
  getBusinessHours,
  listBookingsBetween,
  listCustomers,
  listServices,
  listStaff,
  type BusinessHours,
  type Customer,
  type StaffMember,
  type VendorBooking,
  type VendorService,
} from '../lib/api';
import { getSession } from '../lib/session';
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  Page,
  PageHeader,
  PillTabs,
  SearchField,
  SectionTitle,
  StickyFooter,
} from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewBooking'>;

/** Used until the business's own gap between start times has loaded. */
const DEFAULT_STEP = 30;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 12-hour time, as on the calendar: "2:00", or "2:00pm" with the suffix. */
function clock(mins: number, suffix = false) {
  const h24 = Math.floor(mins / 60) % 24;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(mins % 60).padStart(2, '0')}${suffix ? (h24 < 12 ? 'am' : 'pm') : ''}`;
}

/** The day split the way people book: "in the morning", "after lunch", "after work". */
const PERIODS = [
  { id: 'morning', label: 'Morning', from: 0, to: 12 * 60 },
  { id: 'afternoon', label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { id: 'evening', label: 'Evening', from: 17 * 60, to: 24 * 60 },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];
const periodOf = (m: number): PeriodId => PERIODS.find((p) => m >= p.from && m < p.to)!.id;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesOf(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export function NewBookingScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const session = getSession();
  const isPractitioner = session?.role === 'practitioner';
  const prefill = route.params?.at ? new Date(route.params.at) : null;

  const [services, setServices] = useState<VendorService[] | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [step, setStep] = useState(DEFAULT_STEP);
  const [clients, setClients] = useState<Customer[] | null>(null);

  const [client, setClient] = useState<Customer | null>(null);
  const [newClient, setNewClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string>(isPractitioner ? session!.staffId : (route.params?.staffId ?? 'any'));
  const [day, setDay] = useState(() => startOfDay(prefill ?? new Date()));
  const [time, setTime] = useState<number | null>(prefill ? minutesOf(prefill) : null);
  const [dayBookings, setDayBookings] = useState<VendorBooking[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listServices().then(setServices).catch(() => setServices([]));
    listStaff().then(setStaff).catch(() => setStaff([]));
    getBusinessHours().then(setHours).catch(() => setHours([]));
    getBookingSettings().then((b) => setStep(b.slotIntervalMinutes)).catch(() => {});
    // Practitioners can't see the client list; they add the client by name.
    listCustomers().then(setClients).catch(() => { setClients([]); setNewClient(true); });
  }, []);

  useEffect(() => {
    const end = new Date(day);
    end.setDate(end.getDate() + 1);
    listBookingsBetween(day, end).then(setDayBookings).catch(() => setDayBookings([]));
  }, [day]);

  const chosen = (services ?? []).filter((s) => picked.includes(s.id));
  const duration = chosen.reduce((t, s) => t + s.durationMinutes, 0);
  const price = chosen.reduce((t, s) => t + s.priceKobo, 0);

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const dayHours = hours.find((h) => h.dayOfWeek === day.getDay());
  const closed = !!dayHours?.isClosed;
  const open = dayHours && !closed ? toMinutes(dayHours.openTime) : 8 * 60;
  const close = dayHours && !closed ? toMinutes(dayHours.closeTime) : 20 * 60;

  // Free start times: inside opening hours, not in the past, and not clashing with the chosen person.
  const times = useMemo(() => {
    const isToday = day.toDateString() === new Date().toDateString();
    const nowMin = minutesOf(new Date());
    const length = Math.max(duration, step);
    const busy = dayBookings
      .filter((b) => ['confirmed', 'pending_payment'].includes(b.status))
      .filter((b) => staffId !== 'any' && b.staff?.id === staffId)
      .map((b) => {
        const s = minutesOf(new Date(b.scheduledAt));
        return [s, s + b.durationMinutes] as const;
      });
    const out: number[] = [];
    for (let m = open; m + length <= close; m += step) {
      if (isToday && m <= nowMin) continue;
      if (busy.some(([a, b]) => m < b && m + length > a)) continue;
      out.push(m);
    }
    return out;
  }, [day, open, close, duration, dayBookings, staffId, step]);

  // Only one part of the day's times at once, so the list never fills the screen.
  const [period, setPeriod] = useState<PeriodId | null>(null);
  const firstPeriod = PERIODS.find((p) => times.some((m) => m >= p.from && m < p.to))?.id ?? 'morning';
  const activePeriod: PeriodId = period ?? (time != null ? periodOf(time) : firstPeriod);
  const shownTimes = times.filter((m) => periodOf(m) === activePeriod);
  useEffect(() => { setPeriod(null); }, [day]);

  const matches = query.trim()
    ? (clients ?? []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email?.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : (clients ?? []).slice(0, 5);

  // A new client needs a name and a phone number (how the business reaches them, and how a returning
  // client is recognised). Email is optional, for receipts and feedback requests.
  const phoneOk = clientPhone.replace(/\D/g, '').length >= 7;
  const emailTrim = clientEmail.trim();
  const emailOk = emailTrim === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  const hasClient = !!client || (newClient && clientName.trim().length > 0 && phoneOk && emailOk);
  const canBook = hasClient && picked.length > 0 && time != null && !saving;

  async function book() {
    if (time == null) return;
    setSaving(true);
    setError('');
    const at = new Date(day);
    at.setMinutes(time);
    try {
      await createBooking({
        customerId: client?.id,
        customerName: client ? undefined : clientName.trim(),
        customerPhone: client ? undefined : clientPhone.trim(),
        customerEmail: client || !emailTrim ? undefined : emailTrim,
        staffId: staffId === 'any' ? undefined : staffId,
        serviceIds: picked,
        scheduledAt: at.toISOString(),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not make the booking. Please try again.');
      setSaving(false);
    }
  }

  const team = staff.filter((m) => m.role !== 'front_desk');

  return (
    <Page
      footer={
        <StickyFooter>
          <View style={{ flex: 1, gap: 10 }}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {picked.length > 0 ? (
              <Text style={styles.summary}>
                {chosen.length} {chosen.length === 1 ? 'service' : 'services'} · {duration} min · {formatNaira(price)}
              </Text>
            ) : null}
            <Button label={time != null ? `Book for ${clock(time, true)}` : 'Book'} onPress={book} loading={saving} disabled={!canBook} />
          </View>
        </StickyFooter>
      }
    >
      <PageHeader title="New booking" onClose={() => navigation.goBack()} />

      {/* Client */}
      <View style={styles.section}>
        <SectionTitle title="Client" />
        {client ? (
          <View style={styles.picked}>
            <Avatar name={client.name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{client.name}</Text>
              {client.email ? <Text style={styles.rowSub}>{client.email}</Text> : null}
            </View>
            <Button label="Change" variant="secondary" size="sm" onPress={() => setClient(null)} />
          </View>
        ) : newClient ? (
          <View style={{ gap: 18 }}>
            <Field label="Client name" value={clientName} onChangeText={setClientName} placeholder="e.g. Ada Obi" autoCapitalize="words" />
            <Field
              label="Phone number"
              value={clientPhone}
              onChangeText={setClientPhone}
              onBlur={() => setPhoneTouched(true)}
              placeholder="0803 000 0000"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              helper="We use it to reach the client and spot them next time."
              error={phoneTouched && !phoneOk ? 'Enter the client’s phone number.' : undefined}
            />
            <Field
              label="Email"
              optional
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="ada@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              helper="For booking receipts and asking how the visit went."
              error={!emailOk && emailTrim.length > 3 ? 'That email doesn’t look right.' : undefined}
            />
            {clients && clients.length > 0 ? (
              <Text style={styles.link} onPress={() => setNewClient(false)}>Pick an existing client instead</Text>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Name or email" />
            {clients == null ? <ActivityIndicator color={colors.link} style={{ marginTop: 12 }} /> : null}
            {matches.map((c) => (
              <Pressable key={c.id} style={styles.clientRow} onPress={() => setClient(c)} accessibilityRole="button">
                <Avatar name={c.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{c.name}</Text>
                  {c.email ? <Text style={styles.rowSub} numberOfLines={1}>{c.email}</Text> : null}
                </View>
              </Pressable>
            ))}
            <Pressable style={styles.clientRow} onPress={() => { setNewClient(true); setClientName(query); }} accessibilityRole="button">
              <View style={styles.plusDisc}><Feather name="plus" size={20} color={colors.link} /></View>
              <Text style={[styles.rowTitle, { color: colors.link }]}>New client{query ? `: ${query}` : ''}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Services */}
      <View style={styles.section}>
        <SectionTitle title="Services" />
        {services == null ? (
          <ActivityIndicator color={colors.link} />
        ) : services.length === 0 ? (
          <EmptyState icon="scissors" title="No services yet" body="Add a service so clients have something to book." />
        ) : (
          services.map((s) => {
            const on = picked.includes(s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])}
                style={styles.service}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={styles.serviceBar} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle}>{s.name}</Text>
                  <Text style={styles.rowSub}>{s.durationMinutes} min</Text>
                  <Text style={styles.price}>{formatNaira(s.priceKobo)}</Text>
                </View>
                <View style={[styles.check, on && styles.checkOn]}>
                  {on ? <Feather name="check" size={18} color={colors.onAccent} /> : null}
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Team member */}
      {!isPractitioner && team.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title="With" />
          <PillTabs
            options={[{ key: 'any', label: 'Anyone' }, ...team.map((m) => ({ key: m.id, label: m.name.split(' ')[0] }))]}
            value={staffId}
            onChange={(k) => { setStaffId(k); setTime(null); }}
          />
        </View>
      ) : null}

      {/* Day and time */}
      <View style={styles.section}>
        <SectionTitle title="When" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ gap: 10, paddingHorizontal: GUTTER }}>
          {days.map((d) => {
            const on = d.getTime() === day.getTime();
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => { setDay(d); setTime(null); }}
                style={[styles.dayChip, on && styles.dayChipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={d.toDateString()}
              >
                <Text style={[styles.dayName, on && styles.onText]}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</Text>
                <Text style={[styles.dayNum, on && styles.onText]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {closed ? <Text style={styles.rowSub}>You're closed this day. You can still book a client in.</Text> : null}
        {times.length === 0 ? (
          <Text style={styles.rowSub}>No free times left this day. Try another day or person.</Text>
        ) : (
          <>
            <View style={styles.periods} accessibilityRole="tablist">
              {PERIODS.map((p) => {
                const n = times.filter((m) => periodOf(m) === p.id).length;
                const on = p.id === activePeriod;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPeriod(p.id)}
                    disabled={n === 0}
                    style={[styles.period, on && styles.periodOn, n === 0 && { opacity: 0.4 }]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on, disabled: n === 0 }}
                    accessibilityLabel={`${p.label}, ${n} free ${n === 1 ? 'time' : 'times'}`}
                  >
                    <Text style={[styles.periodText, on && styles.periodTextOn]}>{p.label}</Text>
                    <Text style={[styles.periodCount, on && styles.periodTextOn]}>{n === 0 ? 'Full' : `${n} free`}</Text>
                  </Pressable>
                );
              })}
            </View>
            {shownTimes.length === 0 ? (
              <Text style={styles.rowSub}>Nothing free in the {activePeriod}. Try another part of the day.</Text>
            ) : (
              <View style={styles.times}>
                {shownTimes.map((m) => {
                  const on = m === time;
                  return (
                    <View key={m} style={styles.timeCell}>
                      <Pressable
                        onPress={() => setTime(m)}
                        style={[styles.timeChip, on && styles.dayChipOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={clock(m, true)}
                      >
                        <Text style={[styles.timeText, on && styles.onText]}>{clock(m)}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  section: { gap: 14 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  plusDisc: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 14, color: colors.textSecondary },
  link: { fontSize: 14, color: colors.link, fontWeight: '500' },
  service: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  serviceBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.accent },
  price: { fontSize: 14, color: colors.text, marginTop: 4 },
  check: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayChip: { width: 54, height: 62, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayName: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  dayNum: { fontSize: 16, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  onText: { color: colors.onPrimary },
  periods: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: colors.surface, gap: 4 },
  period: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  periodOn: { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  periodText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  periodTextOn: { color: colors.text },
  periodCount: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  // Four to a row on any width: each cell is a quarter, padded instead of using gap.
  times: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: -4 },
  timeCell: { width: '25%', padding: 4 },
  timeChip: { height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  summary: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  error: { fontSize: 14, color: colors.error, textAlign: 'center' },
}));
