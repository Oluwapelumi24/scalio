import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import {
  getBusinessHours,
  listBookingsBetween,
  listStaff,
  statusLabel,
  type BookingStatus,
  type BusinessHours,
  type StaffMember,
  type VendorBooking,
} from '../lib/api';
import { getSession } from '../lib/session';
import { TabFrame } from '../components/TabFrame';
import { Avatar, IconButton } from '../components/ui';
import { GUTTER, makeStyles, useTheme, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const HOUR_H = 88;
const TIME_COL = 64;
const MIN_COL = 150;
const SLOT_MIN = 15;

interface Column {
  id: string | null;
  name: string;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function clock(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function dayTitle(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Block colours by status: confirmed in navy, waiting for payment in amber, done in green. */
function tone(status: BookingStatus, colors: Colors) {
  switch (status) {
    case 'pending_payment':
      return { bg: colors.warningLight, bar: colors.warning, fg: colors.text };
    case 'completed':
      return { bg: colors.successLight, bar: colors.success, fg: colors.text };
    case 'no_show':
    case 'cancelled_by_customer':
    case 'cancelled_by_vendor':
      return { bg: colors.surface, bar: colors.borderStrong, fg: colors.textMuted };
    default:
      return { bg: colors.accentLight, bar: colors.accent, fg: colors.text };
  }
}

export function CalendarScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const session = getSession();

  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const gridScroll = useRef<ScrollView>(null);
  const headScroll = useRef<ScrollView>(null);
  const scrolledFor = useRef<string>('');

  // Team and opening hours change rarely; load them once.
  useEffect(() => {
    listStaff().then(setStaff).catch(() => setStaff([]));
    getBusinessHours().then(setHours).catch(() => setHours([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setBookings(await listBookingsBetween(day, addDays(day, 1)));
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Keep the red line moving.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const todayHours = hours.find((h) => h.dayOfWeek === day.getDay());
  const openMin = todayHours && !todayHours.isClosed ? toMinutes(todayHours.openTime) : null;
  const closeMin = todayHours && !todayHours.isClosed ? toMinutes(todayHours.closeTime) : null;

  // Show an hour either side of opening hours (and of any booking outside them).
  const [startHour, endHour] = useMemo(() => {
    let lo = openMin != null ? Math.floor(openMin / 60) - 1 : 7;
    let hi = closeMin != null ? Math.ceil(closeMin / 60) + 1 : 22;
    for (const b of bookings) {
      const s = new Date(b.scheduledAt);
      lo = Math.min(lo, s.getHours());
      hi = Math.max(hi, Math.ceil((s.getHours() * 60 + s.getMinutes() + b.durationMinutes) / 60));
    }
    return [Math.max(0, lo), Math.min(24, hi)];
  }, [openMin, closeMin, bookings]);

  const columns: Column[] = useMemo(() => {
    if (session?.role === 'practitioner') return [{ id: session.staffId, name: session.name }];
    const people = (staff ?? []).filter((m) => m.role !== 'front_desk').map((m) => ({ id: m.id, name: m.name }));
    const known = new Set(people.map((p) => p.id));
    const unassigned = bookings.some((b) => !b.staff || !known.has(b.staff.id));
    if (people.length === 0) return [{ id: null, name: 'Bookings' }];
    return unassigned ? [...people, { id: null, name: 'Anyone' }] : people;
  }, [staff, bookings, session]);

  const colWidth = Math.max(MIN_COL, (width - TIME_COL) / columns.length);
  const gridHeight = (endHour - startHour) * HOUR_H;
  const isToday = sameDay(day, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - startHour * 60) / 60) * HOUR_H;

  // Open on the current time (today) or the start of the day.
  useEffect(() => {
    const key = `${day.toDateString()}:${startHour}`;
    if (loading || scrolledFor.current === key) return;
    scrolledFor.current = key;
    const target = isToday ? Math.max(0, nowTop - HOUR_H * 1.5) : openMin != null ? ((openMin - startHour * 60) / 60) * HOUR_H : 0;
    requestAnimationFrame(() => gridScroll.current?.scrollTo({ y: target, animated: false }));
  }, [loading, day, startHour, isToday, nowTop, openMin]);

  function bookAt(col: Column, e: GestureResponderEvent) {
    const mins = startHour * 60 + Math.floor(((e.nativeEvent.locationY / HOUR_H) * 60) / SLOT_MIN) * SLOT_MIN;
    const at = new Date(day);
    at.setMinutes(mins);
    navigation.navigate('NewBooking', { at: at.toISOString(), staffId: col.id ?? undefined });
  }

  const inColumn = (col: Column) =>
    bookings.filter((b) =>
      col.id === null
        ? !b.staff || !columns.some((c) => c.id === b.staff!.id)
        : b.staff?.id === col.id || (columns.length === 1 && session?.role === 'practitioner'),
    );

  return (
    <TabFrame>
      {/* Header: date picker on the left, list view, alerts and profile on the right */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" label="Back" onPress={() => navigation.goBack()} />
        <Pressable
          onPress={() => setPicker(true)}
          style={styles.dateBtn}
          accessibilityRole="button"
          accessibilityLabel={`${dayTitle(day)}. Change day`}
        >
          <Text style={styles.dateText}>{isToday ? 'Today' : dayTitle(day)}</Text>
          <Feather name="chevron-down" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <IconButton icon="list" label="Bookings as a list" onPress={() => navigation.navigate('Bookings')} />
          <IconButton icon="bar-chart-2" label="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
          <Pressable onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Settings and profile">
            <Avatar name={session?.name ?? 'You'} size={44} />
          </Pressable>
        </View>
      </View>

      {/* Team header, scrolled in step with the grid */}
      <View style={styles.teamRow}>
        <View style={{ width: TIME_COL }} />
        <ScrollView ref={headScroll} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
          {columns.map((c) => (
            <View key={c.id ?? 'any'} style={[styles.teamCell, { width: colWidth }]}>
              {c.id ? <Avatar name={c.name} size={44} /> : <View style={styles.anyone}><Feather name="users" size={20} color={colors.textSecondary} /></View>}
              <Text style={styles.teamName} numberOfLines={1}>{c.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {loading && bookings.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.link} />
      ) : (
        <ScrollView ref={gridScroll} style={styles.grid} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', height: gridHeight }}>
            {/* Time gutter */}
            <View style={{ width: TIME_COL }}>
              {Array.from({ length: endHour - startHour }, (_, i) => (
                <Text key={i} style={[styles.hourLabel, { top: i * HOUR_H }]}>{clock((startHour + i) * 60)}</Text>
              ))}
              {isToday && nowTop >= 0 && nowTop <= gridHeight ? (
                <View style={[styles.nowPill, { top: nowTop - 13 }]}>
                  <Text style={styles.nowPillText}>{clock(nowMin)}</Text>
                </View>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => headScroll.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false })}
            >
              <View style={{ flexDirection: 'row', height: gridHeight }}>
                {columns.map((col) => (
                  <Pressable
                    key={col.id ?? 'any'}
                    onPress={(e) => bookAt(col, e)}
                    style={[styles.column, { width: colWidth, height: gridHeight }]}
                    accessibilityLabel={`Book with ${col.name}`}
                  >
                    {/* Closed hours shaded */}
                    {openMin == null ? (
                      <View pointerEvents="none" style={[styles.off, { top: 0, height: gridHeight }]} />
                    ) : (
                      <>
                        <View pointerEvents="none" style={[styles.off, { top: 0, height: ((openMin - startHour * 60) / 60) * HOUR_H }]} />
                        <View pointerEvents="none" style={[styles.off, { top: ((closeMin! - startHour * 60) / 60) * HOUR_H, bottom: 0 }]} />
                      </>
                    )}
                    {Array.from({ length: endHour - startHour }, (_, i) => (
                      <View key={i} pointerEvents="none" style={[styles.hourLine, { top: i * HOUR_H }]} />
                    ))}

                    {inColumn(col).map((b) => {
                      const s = new Date(b.scheduledAt);
                      const top = (((s.getHours() - startHour) * 60 + s.getMinutes()) / 60) * HOUR_H;
                      const height = Math.max(32, (b.durationMinutes / 60) * HOUR_H - 3);
                      const t = tone(b.status, colors);
                      const startM = s.getHours() * 60 + s.getMinutes();
                      return (
                        <Pressable
                          key={b.id}
                          onPress={() => navigation.navigate('BookingDetail', { booking: b })}
                          style={[styles.block, { top: top + 1, height, backgroundColor: t.bg, borderLeftColor: t.bar }]}
                          accessibilityRole="button"
                          accessibilityLabel={`${clock(startM)}, ${b.customer?.name ?? 'Client'}, ${statusLabel(b.status)}`}
                        >
                          <Text style={[styles.blockTime, { color: t.fg }]} numberOfLines={1}>
                            {clock(startM)} – {clock(startM + b.durationMinutes)}
                          </Text>
                          <Text style={[styles.blockName, { color: t.fg }]} numberOfLines={1}>{b.customer?.name ?? 'Client'}</Text>
                          {height > 56 ? (
                            <Text style={styles.blockService} numberOfLines={1}>{b.services.map((x) => x.name).join(', ')}</Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </Pressable>
                ))}
                {isToday && nowTop >= 0 && nowTop <= gridHeight ? (
                  <View pointerEvents="none" style={[styles.nowLine, { top: nowTop }]} />
                ) : null}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      <DayPicker
        visible={picker}
        value={day}
        onClose={() => setPicker(false)}
        onPick={(d) => {
          setPicker(false);
          setLoading(true);
          setDay(startOfDay(d));
        }}
        onList={() => {
          setPicker(false);
          navigation.navigate('Bookings');
        }}
      />
    </TabFrame>
  );
}

/** Bottom sheet with a month grid, Today, and the list view. */
function DayPicker({
  visible,
  value,
  onClose,
  onPick,
  onList,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onPick: (d: Date) => void;
  onList: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  useEffect(() => {
    if (visible) setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [visible, value]);

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.monthRow}>
          <Text style={styles.monthTitle}>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="chevron-left" label="Previous month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <IconButton icon="chevron-right" label="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
          </View>
        </View>
        <View style={styles.weekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.weekday}>{d}</Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={styles.dayCell} />;
            const on = sameDay(d, value);
            const isT = sameDay(d, today);
            return (
              <Pressable key={i} style={styles.dayCell} onPress={() => onPick(d)} accessibilityRole="button" accessibilityLabel={d.toDateString()}>
                <View style={[styles.dayDot, on && { backgroundColor: colors.accent }, !on && isT && { borderWidth: 1, borderColor: colors.link }]}>
                  <Text style={[styles.dayNum, on && { color: colors.onAccent, fontWeight: '700' }]}>{d.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sheetActions}>
          <Pressable style={styles.sheetAction} onPress={() => onPick(today)} accessibilityRole="button">
            <Feather name="sun" size={20} color={colors.text} />
            <Text style={styles.sheetActionText}>Today</Text>
          </Pressable>
          <Pressable style={styles.sheetAction} onPress={onList} accessibilityRole="button">
            <Feather name="list" size={20} color={colors.text} />
            <Text style={styles.sheetActionText}>All bookings as a list</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER - 6, paddingVertical: 10 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 2 },
  dateText: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  teamRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  teamCell: { alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 6 },
  teamName: { fontSize: 14, fontWeight: '600', color: colors.text, maxWidth: '100%' },
  anyone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, borderStyle: 'dashed' },

  grid: { flex: 1, backgroundColor: colors.background },
  hourLabel: { position: 'absolute', left: 0, width: TIME_COL, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.text, marginTop: -9, fontVariant: ['tabular-nums'] },
  column: { borderLeftWidth: 1, borderLeftColor: colors.border },
  off: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.offHours },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  block: {
    position: 'absolute', left: 4, right: 4, borderRadius: 10, borderLeftWidth: 4,
    paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', gap: 1,
  },
  blockTime: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  blockName: { fontSize: 14, fontWeight: '700' },
  blockService: { fontSize: 12, color: colors.textSecondary },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.nowLine },
  nowPill: {
    position: 'absolute', left: 2, right: 2, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.nowLine,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  nowPillText: { fontSize: 13, fontWeight: '700', color: colors.nowLine, fontVariant: ['tabular-nums'] },

  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: GUTTER - 8, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 },
  monthTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  weekdays: { flexDirection: 'row', marginTop: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textMuted },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
  sheetActions: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 6 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  sheetActionText: { fontSize: 17, color: colors.text },
}));
