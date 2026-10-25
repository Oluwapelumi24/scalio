import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  addExpense, getExpenseCategories, getLedger, getMoneySummary, listExpenses, naira, voidExpense,
  type Expense, type LedgerEntry, type MoneySummary,
} from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Money'>;

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function monthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: isoDate(start), to: isoDate(end), label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
}

export function MoneyScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const range = monthRange(offset);

  const load = useCallback(async () => {
    const r = monthRange(offset);
    try {
      const [s, l, e] = await Promise.all([
        getMoneySummary(r.from, r.to),
        getLedger(r.from, r.to),
        listExpenses(r.from, r.to),
      ]);
      setSummary(s); setEntries(l); setExpenses(e);
    } catch (err) {
      Alert.alert('Could not load money', err instanceof Error ? err.message : 'Please try again.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [offset]);
  useEffect(() => { setLoading(true); void load(); }, [load]);
  useEffect(() => { getExpenseCategories().then(setCategories).catch(() => {}); }, []);

  async function add() {
    const kobo = Math.round(Number(amount) * 100);
    if (!kobo || kobo <= 0) { Alert.alert('Enter an amount', 'How much did you spend, in naira?'); return; }
    setBusy(true);
    try {
      await addExpense({ amountKobo: kobo, category, spentOn: isoDate(new Date()), note: note.trim() || undefined });
      setAmount(''); setNote('');
      if (offset !== 0) setOffset(0); else await load();
    } catch (err) {
      Alert.alert('Could not add expense', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  function remove(e: Expense) {
    Alert.alert('Remove expense?', `${e.category} · ${naira(e.amountKobo)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await voidExpense(e.id); await load(); } },
    ]);
  }

  const rows: [string, number, string?][] = summary ? [
    ['Sales', summary.salesKobo, 'Completed bookings at their booked price'],
    ['Received online', summary.receivedOnlineKobo, 'Paid to your bank by Paystack'],
    ['Salaries paid', -summary.salariesKobo],
    ['Expenses', -summary.expensesKobo],
  ] : [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Money</Text>
        <View style={styles.chips}>
          {[0, -1].map((o) => (
            <Pressable key={o} onPress={() => setOffset(o)} style={[styles.chip, offset === o && styles.chipOn]} accessibilityState={{ selected: offset === o }}>
              <Text style={[styles.chipText, offset === o && styles.chipTextOn]}>{o === 0 ? 'This month' : 'Last month'}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {loading || !summary ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{range.label}</Text>
            {rows.map(([label, value, hint]) => (
              <View key={label} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineLabel}>{label}</Text>
                  {hint ? <Text style={styles.meta}>{hint}</Text> : null}
                </View>
                <Text style={[styles.lineValue, value < 0 && { color: colors.textSecondary }]}>{value < 0 ? `−${naira(-value)}` : naira(value)}</Text>
              </View>
            ))}
            <View style={[styles.line, styles.net]}>
              <Text style={styles.netLabel}>Left over</Text>
              <Text style={[styles.netValue, summary.netKobo < 0 && { color: colors.error }]}>
                {summary.netKobo < 0 ? `−${naira(-summary.netKobo)}` : naira(summary.netKobo)}
              </Text>
            </View>
          </View>

          <Text style={styles.section}>Add an expense</Text>
          <View style={[styles.card, { gap: spacing.md }]}>
            <TextInput style={styles.input} value={amount} onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="Amount in ₦" placeholderTextColor={colors.textMuted} />
            <View style={styles.cats}>
              {categories.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Note (optional)" placeholderTextColor={colors.textMuted} maxLength={200} />
            <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={add} disabled={busy} accessibilityRole="button">
              <Text style={styles.primaryText}>Add expense</Text>
            </Pressable>
          </View>

          {expenses.length > 0 && (
            <>
              <Text style={styles.section}>Expenses</Text>
              <View style={styles.card}>
                {expenses.map((e, i) => (
                  <View key={e.id} style={[styles.line, i > 0 && styles.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineLabel}>{e.category}{e.note ? ` · ${e.note}` : ''}</Text>
                      <Text style={styles.meta}>{e.spentOn}</Text>
                    </View>
                    <Text style={styles.lineValue}>{naira(e.amountKobo)}</Text>
                    <Pressable onPress={() => remove(e)} hitSlop={8} accessibilityLabel={`Remove ${e.category} expense`}>
                      <Feather name="trash-2" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.section}>Activity</Text>
          <View style={styles.card}>
            {entries.length === 0 ? (
              <Text style={styles.meta}>Nothing recorded this month yet.</Text>
            ) : entries.map((e, i) => (
              <View key={e.id} style={[styles.line, i > 0 && styles.divider]}>
                <Feather name={e.direction === 'in' ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={e.direction === 'in' ? colors.success : colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineLabel}>{e.description}</Text>
                  <Text style={styles.meta}>{new Date(e.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <Text style={[styles.lineValue, e.direction === 'out' && { color: colors.textSecondary }]}>
                  {e.direction === 'in' ? '+' : '−'}{naira(e.amountKobo)}
                </Text>
              </View>
            ))}
          </View>
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
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginBottom: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  lineLabel: { fontSize: typography.size.base, color: colors.text, fontWeight: typography.weight.medium },
  lineValue: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text, fontVariant: ['tabular-nums'] },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  net: { borderTopWidth: 1, borderTopColor: colors.borderStrong, marginTop: spacing.xs },
  netLabel: { flex: 1, fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  netValue: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, fontVariant: ['tabular-nums'] },
  section: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
}));
