import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getReports, naira, type ReportGroup, type ReportKind, type ReportsOverview } from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PERIODS = [
  { id: 'month', label: 'This month', range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) }; } },
  { id: 'last', label: 'Last month', range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: iso(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
  { id: '90', label: 'Last 90 days', range: () => { const n = new Date(); return { from: iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - 89)), to: iso(n) }; } },
] as const;

const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
const signed = (k: number) => (k < 0 ? `−${naira(-k)}` : naira(k));

export function ReportsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('month');
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const range = PERIODS.find((p) => p.id === period)!.range();

  const load = useCallback(async () => {
    const r = PERIODS.find((p) => p.id === period)!.range();
    try { setData(await getReports(r.from, r.to)); setError(null); } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally { setRefreshing(false); }
  }, [period]);
  useEffect(() => { setData(null); void load(); }, [load]);

  const open = (kind: ReportKind, title: string, g?: ReportGroup) =>
    navigation.navigate('ReportRecords', { kind, key: g?.key, title: g ? `${title}: ${g.label}` : title, from: range.from, to: range.to });

  function Groups({ kind, title, groups, money = true, max = 6 }: { kind: ReportKind; title: string; groups: ReportGroup[]; money?: boolean; max?: number }) {
    if (groups.length === 0) return <Text style={styles.meta}>Nothing in this period.</Text>;
    const top = Math.max(...groups.map((g) => (money ? g.amountKobo ?? 0 : g.count)), 1);
    return (
      <View style={{ gap: spacing.sm }}>
        {groups.slice(0, max).map((g) => (
          <Pressable key={g.key} onPress={() => open(kind, title, g)} style={styles.groupRow} accessibilityRole="button" accessibilityHint="Shows the records behind this figure">
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.groupTop}>
                <Text style={styles.groupLabel} numberOfLines={1}>{g.label}</Text>
                <Text style={styles.groupValue}>{money ? naira(g.amountKobo ?? 0) : g.count}</Text>
              </View>
              <View style={styles.barTrack}><View style={[styles.bar, { width: `${Math.max(2, ((money ? g.amountKobo ?? 0 : g.count) / top) * 100)}%` }]} /></View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    );
  }

  function Stat({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.stat}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  function Card({ title, definition, onAll, children }: { title: string; definition: string; onAll: () => void; children: React.ReactNode }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Pressable onPress={onAll} hitSlop={8}><Text style={styles.link}>See all</Text></Pressable>
        </View>
        {children}
        <Text style={styles.definition}>{definition}</Text>
      </View>
    );
  }

  const d = data?.definitions ?? {};

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Reports</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PERIODS.map((p) => (
            <Pressable key={p.id} onPress={() => setPeriod(p.id)} style={[styles.chip, period === p.id && styles.chipOn]} accessibilityState={{ selected: period === p.id }}>
              <Text style={[styles.chipText, period === p.id && styles.chipTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      {error ? (
        <View style={styles.content}><View style={styles.card}><Text style={styles.meta}>Couldn't load reports. {error}</Text>
          <Pressable onPress={() => void load()}><Text style={styles.link}>Try again</Text></Pressable></View></View>
      ) : !data ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
          <Card title="Sales" definition={d.sales} onAll={() => open('sales', 'Sales')}>
            <View style={styles.stats}>
              <Stat label="Sales" value={naira(data.sales.salesKobo)} />
              <Stat label="Completed" value={String(data.sales.completed)} />
              <Stat label="Average sale" value={data.sales.averageSaleKobo === null ? '—' : naira(data.sales.averageSaleKobo)} />
            </View>
            <Text style={styles.sub}>By service</Text>
            <Groups kind="sales" title="Sales" groups={data.sales.byService} />
            <Text style={styles.sub}>By staff</Text>
            <Groups kind="sales" title="Sales" groups={data.sales.byStaff} />
          </Card>

          <Card title="Bookings" definition={`${d.cancellationRate} ${d.noShowRate}`} onAll={() => open('bookings', 'Bookings')}>
            <View style={styles.stats}>
              <Stat label="Bookings" value={String(data.bookings.total)} />
              <Stat label="Cancelled" value={pct(data.bookings.cancellationRate)} />
              <Stat label="No-shows" value={pct(data.bookings.noShowRate)} />
            </View>
            <Groups kind="bookings" title="Bookings" groups={data.bookings.byStatus} money={false} />
            <Text style={styles.sub}>Busiest days</Text>
            <Groups kind="bookings" title="Bookings" groups={data.bookings.byWeekday} money={false} max={7} />
          </Card>

          <Card title="Cash flow" definition={d.cashflow} onAll={() => open('cashflow', 'Cash flow')}>
            <View style={styles.stats}>
              <Stat label="In" value={naira(data.cashflow.inKobo)} />
              <Stat label="Out" value={naira(data.cashflow.outKobo)} />
              <Stat label="Net" value={signed(data.cashflow.netKobo)} />
            </View>
            <Groups kind="cashflow" title="Cash flow" groups={data.cashflow.groups} />
          </Card>

          <Card title="Expenses" definition={d.expenses} onAll={() => open('expenses', 'Expenses')}>
            <View style={styles.stats}><Stat label="Total" value={naira(data.expenses.totalKobo)} /></View>
            <Groups kind="expenses" title="Expenses" groups={data.expenses.byCategory} />
          </Card>

          <Card title="New customers" definition={d.newCustomers} onAll={() => open('customers', 'New customers')}>
            <View style={styles.stats}>
              <Stat label="New" value={String(data.customers.newCustomers)} />
              <Stat label="Have visited" value={String(data.customers.visited)} />
            </View>
            <Groups kind="customers" title="New customers" groups={data.customers.bySource} money={false} />
          </Card>

          <Card title="Keeping customers" definition={`${d.returning} ${d.repeatRate} ${d.lapsed}`} onAll={() => open('retention', 'Customers served')}>
            <View style={styles.stats}>
              <Stat label="Served" value={String(data.retention.served)} />
              <Stat label="Came back" value={pct(data.retention.returningRate)} />
              <Stat label="Repeat (all time)" value={pct(data.retention.repeatRate)} />
            </View>
            <Groups kind="retention" title="Customers" groups={data.retention.groups} money={false} />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  statValue: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  sub: { fontSize: 16, lineHeight: 23, fontWeight: typography.weight.semibold, color: colors.textSecondary, marginTop: spacing.xs },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  groupLabel: { flex: 1, fontSize: typography.size.sm, color: colors.text },
  groupValue: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text, fontVariant: ['tabular-nums'] },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  definition: { fontSize: typography.size.xs, color: colors.textMuted, lineHeight: 16 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
}));
