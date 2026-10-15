import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  addTimeOff,
  getStaffSchedule,
  minutesToClock,
  removeTimeOff,
  setStaffSchedule,
  type StaffDay,
  type TimeOff,
} from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffSchedule'>;

// Monday first, the way most businesses think about the week.
const DAYS = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STEP = 30;

interface DayState {
  working: boolean;
  start: number;
  end: number;
  hasBreak: boolean;
  breakStart: number;
  breakEnd: number;
}

function toState(days: StaffDay[]): Record<number, DayState> {
  const out: Record<number, DayState> = {};
  for (const d of DAYS) {
    const row = days.find((x) => x.dayOfWeek === d);
    out[d] = row
      ? {
          working: true,
          start: row.startsAtMinutes,
          end: row.endsAtMinutes,
          hasBreak: row.breakStartsAtMinutes != null,
          breakStart: row.breakStartsAtMinutes ?? 13 * 60,
          breakEnd: row.breakEndsAtMinutes ?? 14 * 60,
        }
      : { working: false, start: 9 * 60, end: 17 * 60, hasBreak: false, breakStart: 13 * 60, breakEnd: 14 * 60 };
  }
  return out;
}

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onChange(Math.max(0, value - STEP))}
          hitSlop={6}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={`${label} earlier`}
        >
          <Feather name="minus" size={14} color={colors.text} />
        </Pressable>
        <Text style={styles.stepValue}>{minutesToClock(value)}</Text>
        <Pressable
          onPress={() => onChange(Math.min(24 * 60, value + STEP))}
          hitSlop={6}
          style={styles.stepBtn}
          accessibilityRole="button"
          accessibilityLabel={`${label} later`}
        >
          <Feather name="plus" size={14} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export function StaffScheduleScreen({ navigation, route }: Props) {
  const { staffId, name } = route.params;
  const session = getSession();
  const canEdit = session?.role === 'owner' || session?.role === 'manager';

  const [days, setDays] = useState<Record<number, DayState>>(toState([]));
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await getStaffSchedule(staffId);
      setDays(toState(s.days));
      setTimeOff(s.timeOff);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the schedule.');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => { void load(); }, [load]);

  const update = (d: number, patch: Partial<DayState>) => setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  const anyWorking = DAYS.some((d) => days[d].working);

  async function save() {
    setSaving(true);
    try {
      const payload: StaffDay[] = DAYS.filter((d) => days[d].working).map((d) => ({
        dayOfWeek: d,
        startsAtMinutes: days[d].start,
        endsAtMinutes: days[d].end,
        breakStartsAtMinutes: days[d].hasBreak ? days[d].breakStart : null,
        breakEndsAtMinutes: days[d].hasBreak ? days[d].breakEnd : null,
      }));
      const s = await setStaffSchedule(staffId, payload);
      setDays(toState(s.days));
      Alert.alert('Saved', `${name}'s working hours are updated. New bookings will follow them.`);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function addLeave() {
    const dateOk = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
    const end = to.trim() || from.trim();
    if (!dateOk(from.trim()) || !dateOk(end)) {
      Alert.alert('Check the dates', 'Use YYYY-MM-DD, for example 2026-12-24.');
      return;
    }
    try {
      const added = await addTimeOff(staffId, from.trim(), end, reason.trim() || undefined);
      setTimeOff((prev) => [...prev, added].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      setFrom('');
      setTo('');
      setReason('');
    } catch (err) {
      Alert.alert('Could not add time off', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  function confirmRemove(t: TimeOff) {
    Alert.alert('Remove time off?', `${t.startDate}${t.endDate !== t.startDate ? ` to ${t.endDate}` : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTimeOff(staffId, t.id);
            setTimeOff((prev) => prev.filter((x) => x.id !== t.id));
          } catch {
            Alert.alert('Error', 'Could not remove time off.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Working hours and time off</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Weekly hours</Text>
          <Text style={styles.hint}>
            {anyWorking
              ? 'Customers can only book this person on the days and times below.'
              : 'No days set — this person can be booked whenever the business is open.'}
          </Text>

          <View style={styles.card}>
            {DAYS.map((d, i) => {
              const day = days[d];
              return (
                <View key={d} style={[styles.dayRow, i > 0 && styles.divider]}>
                  <View style={styles.dayHead}>
                    <Text style={[styles.dayName, !day.working && styles.muted]}>{DAY_NAMES[d]}</Text>
                    <Switch
                      value={day.working}
                      onValueChange={(v) => update(d, { working: v })}
                      disabled={!canEdit}
                      trackColor={{ true: colors.accent, false: colors.border }}
                      accessibilityLabel={`Works on ${DAY_NAMES[d]}`}
                    />
                  </View>
                  {day.working && (
                    <>
                      <View style={styles.times}>
                        <Stepper label="Starts" value={day.start} onChange={(v) => canEdit && update(d, { start: v })} />
                        <Stepper label="Ends" value={day.end} onChange={(v) => canEdit && update(d, { end: v })} />
                      </View>
                      <Pressable
                        style={styles.breakToggle}
                        onPress={() => canEdit && update(d, { hasBreak: !day.hasBreak })}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: day.hasBreak }}
                      >
                        <Feather name={day.hasBreak ? 'check-square' : 'square'} size={16} color={colors.accent} />
                        <Text style={styles.breakLabel}>Break</Text>
                      </Pressable>
                      {day.hasBreak && (
                        <View style={styles.times}>
                          <Stepper label="Break from" value={day.breakStart} onChange={(v) => canEdit && update(d, { breakStart: v })} />
                          <Stepper label="Break until" value={day.breakEnd} onChange={(v) => canEdit && update(d, { breakEnd: v })} />
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {canEdit && (
            <Pressable style={[styles.primary, saving && { opacity: 0.6 }]} onPress={save} disabled={saving} accessibilityRole="button">
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryLabel}>Save working hours</Text>}
            </Pressable>
          )}

          <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Time off</Text>
          <Text style={styles.hint}>Nobody can book this person on these days.</Text>

          {timeOff.length === 0 ? (
            <Text style={styles.empty}>No time off coming up.</Text>
          ) : (
            <View style={styles.card}>
              {timeOff.map((t, i) => (
                <View key={t.id} style={[styles.leaveRow, i > 0 && styles.divider]}>
                  <Feather name="sun" size={16} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaveDates}>
                      {t.startDate}{t.endDate !== t.startDate ? ` → ${t.endDate}` : ''}
                    </Text>
                    {t.reason ? <Text style={styles.leaveReason}>{t.reason}</Text> : null}
                  </View>
                  {canEdit && (
                    <Pressable onPress={() => confirmRemove(t)} hitSlop={8} accessibilityLabel="Remove time off">
                      <Feather name="trash-2" size={16} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          {canEdit && (
            <View style={[styles.card, { padding: spacing.lg, marginTop: spacing.md, gap: spacing.sm }]}>
              <Text style={styles.addTitle}>Add time off</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="From YYYY-MM-DD" value={from} onChangeText={setFrom} autoCapitalize="none" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="To (optional)" value={to} onChangeText={setTo} autoCapitalize="none" placeholderTextColor={colors.textMuted} />
              </View>
              <TextInput style={styles.input} placeholder="Reason (optional)" value={reason} onChangeText={setReason} placeholderTextColor={colors.textMuted} />
              <Pressable style={styles.secondary} onPress={addLeave} accessibilityRole="button">
                <Feather name="plus" size={16} color={colors.accent} />
                <Text style={styles.secondaryLabel}>Add time off</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  error: { margin: spacing.xl, color: colors.error, textAlign: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  hint: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  card: { backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  dayRow: { padding: spacing.lg, gap: spacing.md },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  muted: { color: colors.textMuted },
  times: { flexDirection: 'row', gap: spacing.md },
  stepper: { flex: 1, gap: 4 },
  stepperLabel: { fontSize: typography.size.xs, color: colors.textMuted },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  stepBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  breakToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  breakLabel: { fontSize: typography.size.sm, color: colors.textSecondary },
  primary: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryLabel: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  empty: { fontSize: typography.size.sm, color: colors.textMuted },
  leaveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  leaveDates: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  leaveReason: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  addTitle: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.size.base,
    color: colors.text,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  secondaryLabel: { color: colors.accent, fontWeight: typography.weight.semibold },
});
