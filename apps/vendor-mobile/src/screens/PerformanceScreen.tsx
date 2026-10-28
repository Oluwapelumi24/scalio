import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { formatNaira, getPerformance, type PerformanceReport, type StaffPerformance } from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Performance'>;

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const hours = (m: number) => `${Math.round((m / 60) * 10) / 10}h`;

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {note ? <Text style={styles.metricNote}>{note}</Text> : null}
    </View>
  );
}

function StaffCard({ p }: { p: StaffPerformance }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}><Text style={styles.avatarLetter}>{p.name.charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.meta}>
            {p.bookings} {p.bookings === 1 ? 'booking' : 'bookings'}{p.upcoming ? ` · ${p.upcoming} still to come` : ''}
          </Text>
        </View>
        {p.attendance?.clockedInNow && (
          <View style={styles.onShift}><Text style={styles.onShiftText}>On shift</Text></View>
        )}
      </View>
      <View style={styles.grid}>
        <Metric label="Sales" value={formatNaira(p.salesKobo)} note={p.averageSaleKobo != null ? `avg ${formatNaira(p.averageSaleKobo)}` : undefined} />
        <Metric label="Completed" value={String(p.completed)} note={p.noShows ? `${p.noShows} no-show${p.noShows === 1 ? '' : 's'}` : undefined} />
        <Metric label="Completion rate" value={pct(p.completionRate)} />
        <Metric label="Repeat customers" value={`${p.repeatCustomers} of ${p.uniqueCustomers}`} />
        <Metric label="Customer rating" value={p.rating ? `${p.rating.average}★` : '—'} note={p.rating ? `${p.rating.count} rating${p.rating.count === 1 ? '' : 's'}` : 'no ratings yet'} />
        {p.attendance && (
          <Metric
            label="Attendance"
            value={p.attendance.rate != null ? pct(p.attendance.rate) : hours(p.attendance.workedMinutes)}
            note={
              p.attendance.scheduledMinutes
                ? `${hours(p.attendance.workedMinutes)} of ${hours(p.attendance.scheduledMinutes)}`
                : p.attendance.scheduledMinutes === null
                  ? 'No weekly hours set'
                  : 'Nothing scheduled yet'
            }
          />
        )}
      </View>
    </View>
  );
}

export function PerformanceScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [period, setPeriod] = useState(30);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showDefs, setShowDefs] = useState(false);

  const load = useCallback(async () => {
    try {
      setReport(await getPerformance(isoDaysAgo(period - 1), isoDaysAgo(0)));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load performance.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { setLoading(true); void load(); }, [load]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Staff performance</Text>
        <View style={styles.chips}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.days}
              onPress={() => setPeriod(p.days)}
              style={[styles.chip, period === p.days && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: period === p.days }}
            >
              <Text style={[styles.chipText, period === p.days && styles.chipTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : error || !report ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          <Text style={styles.caution}>
            People work different hours and see different customers, so compare with care — there's no single score.
          </Text>

          {report.staff.length === 0 ? (
            <Text style={styles.empty}>No staff yet.</Text>
          ) : (
            report.staff.map((p) => <StaffCard key={p.staffId ?? 'unassigned'} p={p} />)
          )}

          {!report.tracksAttendance && (
            <Text style={styles.note}>Attendance appears here once your team starts clocking in.</Text>
          )}

          <Pressable style={styles.defsToggle} onPress={() => setShowDefs((v) => !v)} accessibilityRole="button">
            <Feather name="info" size={15} color={colors.accent} />
            <Text style={styles.defsToggleText}>How these are calculated</Text>
            <Feather name={showDefs ? 'chevron-up' : 'chevron-down'} size={15} color={colors.accent} />
          </Pressable>
          {showDefs && (
            <View style={[styles.card, { gap: spacing.md }]}>
              {Object.entries(report.definitions).map(([key, text]) => (
                <View key={key}>
                  <Text style={styles.defKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</Text>
                  <Text style={styles.defText}>{text}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 22, letterSpacing: -0.6, lineHeight: 28, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  error: { margin: spacing.xl, color: colors.error, textAlign: 'center' },
  caution: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 18 },
  empty: { fontSize: typography.size.base, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  note: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.white, fontWeight: typography.weight.bold },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  onShift: { backgroundColor: colors.successLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  onShiftText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  metric: { width: '50%' },
  metricValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  metricLabel: { fontSize: typography.size.sm, color: colors.textMuted },
  metricNote: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 1 },
  defsToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  defsToggleText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.base },
  defKey: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  defText: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
}));
