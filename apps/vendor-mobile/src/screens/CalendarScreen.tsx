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
  getBookingSettings,
  getBusinessHours,
  listBookingsBetween,
  listStaff,
  naira,
  statusLabel,
  type BookingStatus,
  type BusinessHours,
  type StaffMember,
  type VendorBooking,
} from '../lib/api';
import { getSession } from '../lib/session';
import { TabFrame } from '../components/TabFrame';
import { IconButton } from '../components/ui';
import { GUTTER, makeStyles, useTheme, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const HOUR_H = 80;
const TIME_COL = 56;
const MIN_COL = 150;
/** Snap for taps on the grid until the business's own gap has loaded. */
const DEFAULT_SLOT_MIN = 30;

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

/** 12-hour time the way clients say it: "9:30", with "am"/"pm" when asked. */
function clock(mins: number, suffix = false) {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')}${suffix ? (h24 < 12 ? 'am' : 'pm') : ''}`;
}

/** Hour gutter label: "9 am", "12 pm". */
function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour % 24 < 12 ? 'am' : 'pm'}`;
}

/** "2h 30m", "45m". */
function span(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

/** Monday of the week containing `d` (businesses here plan Monday to Sunday). */
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

const isCancelled = (s: BookingStatus) => s === 'cancelled_by_customer' || s === 'cancelled_by_vendor';
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/**
 * Side-by-side lanes for bookings that overlap in one column: a laundromat or
 * a salon with several chairs often has two clients at the same time.
 */
function layoutLanes(list: VendorBooking[]) {
  const sorted = [...list].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const out = new Map<string, { lane: number; lanes: number }>();
  let group: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  const flush = () => {
    for (const g of group) out.set(g.id, { lane: g.lane, lanes: laneEnds.length });
    group = [];
    laneEnds = [];
  };
  for (const b of sorted) {
    const s = +new Date(b.scheduledAt);
    const e = s + b.durationMinutes * 60_000;
    if (s >= groupEnd) { flush(); groupEnd = -1; }
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e); } else laneEnds[lane] = e;
    group.push({ id: b.id, lane });
    groupEnd = Math.max(groupEnd, e);
  }
  flush();
  return out;
}

/** What the client owes or has paid, in a few words. */
function paymentNote(b: VendorBooking): string | null {
  if (b.status === 'pending_payment') return 'Awaiting payment';
  if (isCancelled(b.status) || b.status === 'no_show') return null;
  if (b.paymentMode === 'full_prepayment') return 'Paid';
  if (b.paymentMode === 'deposit') return 'Deposit paid';
  return b.totalAmountKobo > 0 ? `${naira(b.totalAmountKobo)} at visit` : null;
}

function dayTitle(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Block colours by status: confirmed in navy, waiting for payment in amber, done in green, cancelled faded. */
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
  const insets = useSafeAreaInsets();
  const session = getSession();
  const isManager = session?.role === 'owner' || session?.role === 'manager';

  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [week, setWeek] = useState<VendorBooking[]>([]);
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [hours, setHours] = useState<BusinessHours[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [slotMin, setSlotMin] = useState(DEFAULT_SLOT_MIN);

  const gridScroll = useRef<ScrollView>(null);
  const headScroll = useRef<ScrollView>(null);
  const scrolledFor = useRef<string>('');

  const weekStart = useMemo(() => startOfWeek(day), [day]);
  const weekKey = weekStart.toDateString();

  // Team and opening hours change rarely; load them once (and again on focus, in case hours were just set).
  const loadSetup = useCallback(() => {
    listStaff().then(setStaff).catch(() => setStaff([]));
    getBusinessHours().then(setHours).catch(() => setHours([]));
    getBookingSettings().then((b) => setSlotMin(b.slotIntervalMinutes)).catch(() => {});
  }, []);

  // One request per week: the strip's busy dots and the day's grid share it.
  const load = useCallback(async () => {
    try {
      setWeek(await listBookingsBetween(weekStart, addDays(weekStart, 7)));
    } catch {
      setWeek([]);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useFocusEffect(useCallback(() => { loadSetup(); void load(); }, [load, loadSetup]));

  // Keep the red line moving.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const bookings = useMemo(() => week.filter((b) => sameDay(new Date(b.scheduledAt), day)), [week, day]);
  const live = bookings.filter((b) => !isCancelled(b.status));

  const hoursSet = (hours?.length ?? 0) > 0;
  const todayHours = hours?.find((h) => h.dayOfWeek === day.getDay());
  const closedToday = !!todayHours?.isClosed;
  const openMin = todayHours && !todayHours.isClosed ? toMinutes(todayHours.openTime) : null;
  const closeMin = todayHours && !todayHours.isClosed ? toMinutes(todayHours.closeTime) : null;

  // An hour either side of opening hours (and of any booking outside them).
  const [startHour, endHour] = useMemo(() => {
    let lo = openMin != null ? Math.floor(openMin / 60) - 1 : 7;
    let hi = closeMin != null ? Math.ceil(closeMin / 60) + 1 : 21;
    for (const b of bookings) {
      const s = new Date(b.scheduledAt);
      lo = Math.min(lo, s.getHours());
      hi = Math.max(hi, Math.ceil((minutesOf(s) + b.durationMinutes) / 60));
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
  const nowMin = minutesOf(now);
  const nowTop = ((nowMin - startHour * 60) / 60) * HOUR_H;
  const yFor = (mins: number) => ((mins - startHour * 60) / 60) * HOUR_H;

  // The day at a glance: how many, what it should bring in, how much room is left, who's next.
  const expectedKobo = live.reduce((sum, b) => sum + (b.status === 'no_show' ? 0 : b.totalAmountKobo), 0);
  const bookedMin = live.reduce((sum, b) => sum + b.durationMinutes, 0);
  const people = columns.filter((c) => c.id !== null).length || 1;
  const freeMin = openMin != null && closeMin != null ? Math.max(0, (closeMin - openMin) * people - bookedMin) : null;
  const next = isToday
    ? live
        .filter((b) => b.status !== 'completed' && b.status !== 'no_show' && minutesOf(new Date(b.scheduledAt)) + b.durationMinutes > nowMin)
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0]
    : undefined;
  const nextIn = next ? minutesOf(new Date(next.scheduledAt)) - nowMin : 0;

  // Open on the current time (today) or opening time.
  useEffect(() => {
    const key = `${day.toDateString()}:${startHour}`;
    if (loading || scrolledFor.current === key) return;
    scrolledFor.current = key;
    const target = isToday ? Math.max(0, nowTop - HOUR_H * 1.25) : openMin != null ? yFor(openMin) - 12 : 0;
    requestAnimationFrame(() => gridScroll.current?.scrollTo({ y: Math.max(0, target), animated: false }));
  }, [loading, day, startHour, isToday, nowTop, openMin]);

  function pickDay(d: Date) {
    const nd = startOfDay(d);
    if (startOfWeek(nd).toDateString() !== weekKey) setLoading(true);
    setDay(nd);
  }

  function bookAt(col: Column, e: GestureResponderEvent) {
    const mins = startHour * 60 + Math.floor(((e.nativeEvent.locationY / HOUR_H) * 60) / slotMin) * slotMin;
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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const countOn = (d: Date) => week.filter((b) => !isCancelled(b.status) && sameDay(new Date(b.scheduledAt), d)).length;
  const closedOn = (d: Date) => !!hours?.find((h) => h.dayOfWeek === d.getDay())?.isClosed;

  return (
    <TabFrame>
      {/* Header: back, the day (tap for a month), today and list view */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" label="Back" onPress={() => navigation.goBack()} />
        <Pressable
          onPress={() => setPicker(true)}
          style={styles.dateBtn}
          accessibilityRole="button"
          accessibilityLabel={`${dayTitle(day)}. Pick another day`}
        >
          <View style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.dateText} numberOfLines={1}>
                {isToday ? 'Today' : day.toLocaleDateString('en-GB', { weekday: 'long' })}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.dateSub}>{day.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: day.getFullYear() === now.getFullYear() ? undefined : 'numeric' })}</Text>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          {!isToday ? (
            <Pressable onPress={() => pickDay(new Date())} style={styles.todayBtn} accessibilityRole="button" accessibilityLabel="Go to today">
              <Text style={styles.todayBtnText}>Today</Text>
            </Pressable>
          ) : null}
          <IconButton icon="list" label="Bookings as a list" onPress={() => navigation.navigate('Bookings')} />
        </View>
      </View>

      {/* Week strip: busy dots per day, swipe a week with the arrows */}
      <View style={styles.weekRow}>
        <Pressable onPress={() => pickDay(addDays(day, -7))} hitSlop={8} style={styles.weekArrow} accessibilityRole="button" accessibilityLabel="Previous week">
          <Feather name="chevron-left" size={20} color={colors.textSecondary} />
        </Pressable>
        {weekDays.map((d) => {
          const on = sameDay(d, day);
          const isT = sameDay(d, now);
          const n = countOn(d);
          const closed = closedOn(d);
          return (
            <Pressable
              key={d.toDateString()}
              onPress={() => pickDay(d)}
              style={[styles.weekDay, on && styles.weekDayOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.toDateString()}${isT ? ', today' : ''}. ${closed ? 'Closed' : `${n} ${n === 1 ? 'booking' : 'bookings'}`}`}
            >
              <Text style={[styles.weekDayName, on && styles.onAccentText, !on && isT && styles.todayText]}>
                {d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3)}
              </Text>
              <Text style={[styles.weekDayNum, on && styles.onAccentText, !on && isT && styles.todayText, !on && closed && styles.closedText]}>
                {d.getDate()}
              </Text>
              <View style={styles.busyDots}>
                {closed && !on ? (
                  <Text style={styles.closedTag}>shut</Text>
                ) : (
                  Array.from({ length: Math.min(n, 3) }, (_, i) => (
                    <View key={i} style={[styles.busyDot, on && { backgroundColor: colors.onAccent }]} />
                  ))
                )}
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => pickDay(addDays(day, 7))} hitSlop={8} style={styles.weekArrow} accessibilityRole="button" accessibilityLabel="Next week">
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* The day at a glance */}
      <View style={styles.summary}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{live.length}</Text>
          <Text style={styles.statLabel}>{live.length === 1 ? 'booking' : 'bookings'}</Text>
        </View>
        {isManager ? (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{naira(expectedKobo)}</Text>
            <Text style={styles.statLabel}>{day < startOfDay(now) ? 'taken' : 'expected'}</Text>
          </View>
        ) : null}
        <View style={styles.stat}>
          <Text style={styles.statValue}>{closedToday ? 'Closed' : freeMin != null ? span(freeMin) : '—'}</Text>
          <Text style={styles.statLabel}>{closedToday ? 'all day' : 'free time'}</Text>
        </View>
      </View>

      {next ? (
        <Pressable
          onPress={() => navigation.navigate('BookingDetail', { booking: next })}
          style={({ pressed }) => [styles.nextCard, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`Next: ${next.customer?.name ?? 'Client'} at ${clock(minutesOf(new Date(next.scheduledAt)), true)}`}
        >
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>{nextIn <= 0 ? 'Now' : nextIn < 60 ? `In ${nextIn}m` : `In ${span(nextIn)}`}</Text>
          </View>
          <Text style={styles.nextText} numberOfLines={1}>
            <Text style={{ fontWeight: '700' }}>{next.customer?.name ?? 'Client'}</Text>
            {` · ${next.services.map((x) => x.name).join(', ') || 'Appointment'} · ${clock(minutesOf(new Date(next.scheduledAt)), true)}`}
          </Text>
          <Feather name="chevron-right" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}

      {hours && !hoursSet && isManager ? (
        <Pressable
          onPress={() => navigation.navigate('BusinessHours')}
          style={({ pressed }) => [styles.hoursCard, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Feather name="clock" size={18} color={colors.warning} />
          <Text style={styles.hoursText}>Set your opening hours so clients only book when you're open.</Text>
          <Text style={styles.hoursAction}>Set hours</Text>
        </Pressable>
      ) : null}

      {/* Team names, only when there's more than one column to tell apart */}
      {columns.length > 1 ? (
        <View style={styles.teamRow}>
          <View style={{ width: TIME_COL }} />
          <ScrollView ref={headScroll} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
            {columns.map((c) => {
              const n = inColumn(c).filter((b) => !isCancelled(b.status)).length;
              return (
                <View key={c.id ?? 'any'} style={[styles.teamCell, { width: colWidth }]}>
                  <Text style={styles.teamName} numberOfLines={1}>{c.id ? c.name.split(' ')[0] : c.name}</Text>
                  <Text style={styles.teamCount}>{n === 0 ? 'Free' : `${n} booked`}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {loading && week.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.link} />
      ) : (
        <ScrollView ref={gridScroll} style={styles.grid} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', height: gridHeight, marginTop: 10 }}>
            {/* Time gutter */}
            <View style={{ width: TIME_COL }}>
              {Array.from({ length: endHour - startHour }, (_, i) => (
                <Text key={i} style={[styles.hourLabel, { top: i * HOUR_H }]}>{hourLabel(startHour + i)}</Text>
              ))}
              {isToday && nowTop >= 0 && nowTop <= gridHeight ? (
                <View style={[styles.nowPill, { top: nowTop - 10 }]}>
                  <Text style={styles.nowPillText}>{clock(nowMin)}</Text>
                </View>
              ) : null}
            </View>

            <ScrollView
              horizontal
              scrollEnabled={columns.length * colWidth > width - TIME_COL}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => headScroll.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false })}
            >
              <View style={{ flexDirection: 'row', height: gridHeight }}>
                {columns.map((col) => {
                  const list = inColumn(col);
                  const lanes = layoutLanes(list);
                  return (
                    <Pressable
                      key={col.id ?? 'any'}
                      onPress={(e) => bookAt(col, e)}
                      style={[styles.column, { width: colWidth, height: gridHeight }]}
                      accessibilityLabel={`Book with ${col.name}`}
                      accessibilityHint="Tap a free time to add a booking"
                    >
                      {/* Closed hours shaded — only when the business has told us its hours */}
                      {closedToday ? (
                        <View pointerEvents="none" style={[styles.off, { top: 0, height: gridHeight }]} />
                      ) : openMin != null && closeMin != null ? (
                        <>
                          <View pointerEvents="none" style={[styles.off, { top: 0, height: yFor(openMin) }]} />
                          <View pointerEvents="none" style={[styles.off, { top: yFor(closeMin), bottom: 0 }]} />
                        </>
                      ) : null}
                      {Array.from({ length: endHour - startHour }, (_, i) => (
                        <View key={i} pointerEvents="none">
                          <View style={[styles.hourLine, { top: i * HOUR_H }]} />
                          <View style={[styles.halfLine, { top: i * HOUR_H + HOUR_H / 2 }]} />
                        </View>
                      ))}

                      {list.map((b) => {
                        const s = new Date(b.scheduledAt);
                        const startM = minutesOf(s);
                        const top = yFor(startM);
                        const height = Math.max(34, (b.durationMinutes / 60) * HOUR_H - 3);
                        const t = tone(b.status, colors);
                        const cancelled = isCancelled(b.status);
                        const { lane, lanes: laneCount } = lanes.get(b.id) ?? { lane: 0, lanes: 1 };
                        const inner = colWidth - 8;
                        const w = inner / laneCount;
                        const note = cancelled ? statusLabel(b.status) : paymentNote(b);
                        const past = isToday ? startM + b.durationMinutes <= nowMin : day < startOfDay(now);
                        return (
                          <Pressable
                            key={b.id}
                            onPress={() => navigation.navigate('BookingDetail', { booking: b })}
                            style={[
                              styles.block,
                              {
                                top: top + 1, height, left: 4 + lane * w, width: w - (laneCount > 1 ? 3 : 0),
                                backgroundColor: t.bg, borderLeftColor: t.bar,
                                opacity: cancelled ? 0.7 : past && b.status === 'confirmed' ? 0.85 : 1,
                              },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`${clock(startM, true)}, ${b.customer?.name ?? 'Client'}, ${b.services.map((x) => x.name).join(', ')}, ${statusLabel(b.status)}${note && !cancelled ? `, ${note}` : ''}`}
                          >
                            <Text style={[styles.blockName, { color: t.fg }, cancelled && styles.struck]} numberOfLines={1}>
                              {b.customer?.name ?? 'Client'}
                            </Text>
                            {height > 44 ? (
                              <Text style={[styles.blockService, cancelled && styles.struck]} numberOfLines={1}>
                                {b.services.map((x) => x.name).join(', ') || 'Appointment'}
                              </Text>
                            ) : null}
                            {height > 64 ? (
                              <View style={styles.blockFoot}>
                                <Text style={styles.blockTime} numberOfLines={1}>
                                  {clock(startM)}–{clock(startM + b.durationMinutes, true)}
                                </Text>
                                {note && laneCount === 1 ? (
                                  <Text style={[styles.blockNote, { color: b.status === 'pending_payment' ? colors.warning : colors.textSecondary }]} numberOfLines={1}>
                                    {note}
                                  </Text>
                                ) : null}
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </Pressable>
                  );
                })}
                {isToday && nowTop >= 0 && nowTop <= gridHeight ? (
                  <View pointerEvents="none" style={[styles.nowLine, { top: nowTop }]}>
                    <View style={styles.nowDot} />
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>

          {/* An empty day says how to fill it, at the top of the visible grid */}
          {bookings.length === 0 && !closedToday ? (
            <View pointerEvents="none" style={[styles.emptyHint, { top: Math.max(10, (isToday ? nowTop : openMin != null ? yFor(openMin) : 0) + 24) }]}>
              <Feather name="plus-circle" size={16} color={colors.link} />
              <Text style={styles.emptyHintText}>No bookings yet. Tap any time to add one.</Text>
            </View>
          ) : null}
          {closedToday ? (
            <View pointerEvents="none" style={[styles.emptyHint, { top: 34 }]}>
              <Feather name="moon" size={16} color={colors.textSecondary} />
              <Text style={styles.emptyHintText}>Closed on {day.toLocaleDateString('en-GB', { weekday: 'long' })}s. You can still add a booking.</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* A walk-in or a call: book without hunting for the slot */}
      <Pressable
        onPress={() => {
          const at = new Date(day);
          at.setHours(0, isToday ? Math.ceil(nowMin / slotMin) * slotMin : openMin ?? 9 * 60, 0, 0);
          navigation.navigate('NewBooking', { at: at.toISOString() });
        }}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel={isToday ? 'New booking, from now' : 'New booking'}
      >
        <Feather name="plus" size={20} color={colors.onAccent} />
        <Text style={styles.fabText}>{isToday ? 'Walk-in' : 'Book'}</Text>
      </Pressable>

      <DayPicker
        visible={picker}
        value={day}
        onClose={() => setPicker(false)}
        onPick={(d) => {
          setPicker(false);
          pickDay(d);
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: GUTTER - 10, paddingTop: 6, paddingBottom: 4 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 2 },
  dateText: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  dateSub: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayBtn: { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },

  weekRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: GUTTER - 16, paddingVertical: 6 },
  weekArrow: { width: 24, alignItems: 'center', justifyContent: 'center', height: 64 },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 14, gap: 2 },
  weekDayOn: { backgroundColor: colors.accent },
  weekDayName: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  weekDayNum: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  onAccentText: { color: colors.onAccent },
  todayText: { color: colors.link },
  closedText: { color: colors.textMuted },
  busyDots: { flexDirection: 'row', gap: 3, height: 10, alignItems: 'center' },
  busyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.link },
  closedTag: { fontSize: 9, lineHeight: 10, color: colors.textMuted },

  summary: {
    flexDirection: 'row', marginHorizontal: GUTTER, marginTop: 6, paddingVertical: 12,
    borderRadius: 16, backgroundColor: colors.surface,
  },
  stat: { flex: 1, alignItems: 'center', gap: 1 },
  statValue: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, color: colors.textSecondary },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: GUTTER, marginTop: 8,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
  },
  nextBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.accentLight },
  nextBadgeText: { fontSize: 12, fontWeight: '700', color: colors.link },
  nextText: { flex: 1, fontSize: 13, color: colors.text },

  hoursCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: GUTTER, marginTop: 8,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.warningLight,
  },
  hoursText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
  hoursAction: { fontSize: 13, fontWeight: '700', color: colors.warning },

  teamRow: { flexDirection: 'row', marginTop: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  teamCell: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  teamName: { fontSize: 13, fontWeight: '700', color: colors.text, maxWidth: '100%' },
  teamCount: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  grid: { flex: 1, backgroundColor: colors.background, marginTop: 4 },
  hourLabel: { position: 'absolute', left: 0, width: TIME_COL - 8, textAlign: 'right', fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: -7, fontVariant: ['tabular-nums'] },
  column: { borderLeftWidth: 1, borderLeftColor: colors.border },
  off: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.offHours },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  halfLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border, opacity: 0.45 },
  block: {
    position: 'absolute', borderRadius: 10, borderLeftWidth: 3,
    paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', gap: 1,
  },
  blockName: { fontSize: 13, fontWeight: '700' },
  blockService: { fontSize: 12, color: colors.textSecondary },
  blockFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' },
  blockTime: { fontSize: 11, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  blockNote: { flex: 1, textAlign: 'right', fontSize: 11, fontWeight: '600' },
  struck: { textDecorationLine: 'line-through' },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.nowLine },
  nowDot: { position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.nowLine },
  nowPill: {
    position: 'absolute', left: 4, right: 6, height: 20, borderRadius: 10,
    backgroundColor: colors.nowLine, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  nowPillText: { fontSize: 11, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  emptyHint: {
    position: 'absolute', left: TIME_COL + 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyHintText: { flex: 1, fontSize: 13, color: colors.textSecondary },

  fab: {
    position: 'absolute', right: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 52, paddingHorizontal: 20, borderRadius: 26, backgroundColor: colors.accent,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: '700', color: colors.onAccent },

  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: GUTTER - 8, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 },
  monthTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  weekdays: { flexDirection: 'row', marginTop: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textMuted },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  sheetActions: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 6 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  sheetActionText: { fontSize: 15, color: colors.text },
}));
