import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  getPayroll, getTransferList, markPayoutPaid, naira, periodLabel, setPayrollSchedule, skipPayout, startPayroll,
  type PayrollOverview, type SalaryRun,
} from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Payroll'>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const STATE = (colors: Colors): Record<string, { icon: FeatherName; bg: string; fg: string; title: string }> => ({
  open: { icon: 'unlock', bg: colors.successLight, fg: colors.success, title: 'Payroll is open' },
  closed: { icon: 'lock', bg: colors.surface, fg: colors.textSecondary, title: 'Payroll is closed' },
  paused: { icon: 'pause-circle', bg: colors.warningLight, fg: colors.warning, title: 'Payroll is paused' },
  not_set_up: { icon: 'calendar', bg: colors.accentLight, fg: colors.accent, title: 'Set your pay day' },});

/**
 * Scalio works out who to pay and when; the owner pays from their own bank and
 * marks each person paid. Starting payroll is only possible inside the salary
 * window, and the reason is always shown when it isn't.
 */
export function PayrollScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [data, setData] = useState<PayrollOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payDay, setPayDay] = useState(25);
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState<SalaryRun | null>(null);

  const load = useCallback(async () => {
    try {
      const o = await getPayroll();
      setData(o);
      if (o.schedule) setPayDay(o.schedule.payDay);
    } catch (err) {
      Alert.alert('Could not load payroll', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    try { await fn(); await load(); } catch (err) {
      Alert.alert('Could not update payroll', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  function confirmPaid(id: string, name: string, amount: number) {
    Alert.alert('Mark as paid?', `Only do this after you've sent ${naira(amount)} to ${name} from your bank.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark paid', onPress: () => run(() => markPayoutPaid(id)) },
    ]);
  }

  const w = data?.window;
  const r = data?.currentRun;
  const allPaid = r?.status === 'completed';
  const look = allPaid
    ? { icon: 'check-circle' as FeatherName, bg: colors.successLight, fg: colors.success, title: 'Everyone is paid' }
    : STATE(colors)[w?.state ?? 'not_set_up'];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Payroll</Text>
        <Text style={styles.subtitle}>Pay your team from your bank, then record it here</Text>
      </SafeAreaView>

      {loading || !data || !w ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          <View style={[styles.banner, { backgroundColor: look.bg }]}>
            <Feather name={look.icon} size={20} color={look.fg} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: look.fg }]}>
                {look.title}{w.state === 'open' && w.period ? ` · ${periodLabel(w.period)}` : ''}
              </Text>
              <Text style={styles.bannerText}>
                {allPaid ? `${periodLabel(r!.period)} salaries are all recorded as paid.` : w.reason}
              </Text>
            </View>
          </View>

          {/* Current payroll */}
          {r ? (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{periodLabel(r.period)}</Text>
                <Text style={styles.meta}>{naira(r.paidKobo)} of {naira(r.totalKobo)} paid</Text>
              </View>
              <View style={styles.progress}><View style={[styles.progressFill, { width: `${r.totalKobo ? (r.paidKobo / r.totalKobo) * 100 : 0}%` }]} /></View>
              {r.payouts.map((p) => {
                const full = transfer?.payouts.find((t) => t.id === p.id)?.accountNumber;
                return (
                  <View key={p.id} style={styles.payout}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{p.staffName}</Text>
                      <Text style={styles.meta} selectable>
                        {p.bankName} · {full ?? `•••• ${p.accountLast4}`} · {p.accountName}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.amount}>{naira(p.amountKobo)}</Text>
                      {p.status === 'pending' ? (
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                          <Pressable onPress={() => run(() => skipPayout(p.id))} disabled={busy} hitSlop={6}>
                            <Text style={styles.link}>Skip</Text>
                          </Pressable>
                          <Pressable style={styles.smallBtn} onPress={() => confirmPaid(p.id, p.staffName, p.amountKobo)} disabled={busy}>
                            <Text style={styles.smallBtnText}>Mark paid</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Text style={[styles.status, { color: p.status === 'paid' ? colors.success : colors.textMuted }]}>
                          {p.status === 'paid' ? 'Paid' : 'Skipped'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
              {r.status === 'open' && (
                <Pressable
                  style={styles.secondary}
                  onPress={async () => setTransfer(transfer ? null : await getTransferList(r.id))}
                  accessibilityRole="button"
                >
                  <Feather name={transfer ? 'eye-off' : 'eye'} size={15} color={colors.text} />
                  <Text style={styles.secondaryText}>{transfer ? 'Hide account numbers' : 'Show account numbers to pay'}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              style={[styles.primary, (!data.canStart || busy) && styles.primaryOff]}
              disabled={!data.canStart || busy}
              onPress={() => run(startPayroll)}
              accessibilityRole="button"
              accessibilityState={{ disabled: !data.canStart }}
            >
              <Text style={[styles.primaryText, !data.canStart && { color: colors.textMuted }]}>
                {w.state === 'open' && w.period ? `Start ${periodLabel(w.period)} payroll · ${naira(data.totals.monthlyKobo)}` : 'Start payroll'}
              </Text>
            </Pressable>
          )}
          {!r && data.blockedReason && w.state === 'open' ? <Text style={styles.blocked}>{data.blockedReason}</Text> : null}

          {/* Team pay */}
          <Text style={styles.section}>Team pay</Text>
          <View style={styles.card}>
            {data.team.map((m, i) => (
              <Pressable
                key={m.staffId}
                style={[styles.member, i > 0 && styles.divider]}
                onPress={() => navigation.navigate('StaffPay', { staffId: m.staffId, name: m.name, pay: m })}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={[styles.meta, !m.verifiedAt && (m.monthlySalaryKobo ?? 0) > 0 && { color: colors.warning }]}>
                    {m.verifiedAt ? `${m.bankName} · •••• ${m.accountLast4}` : (m.monthlySalaryKobo ?? 0) > 0 ? 'Add a bank account' : 'No salary set'}
                  </Text>
                </View>
                <Text style={styles.amount}>{m.monthlySalaryKobo ? naira(m.monthlySalaryKobo) : '—'}</Text>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Schedule */}
          <Text style={styles.section}>Pay day</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>Every month on the</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setPayDay((d) => Math.max(1, d - 1))} hitSlop={6} style={styles.stepBtn} accessibilityLabel="Earlier">
                  <Feather name="minus" size={14} color={colors.text} />
                </Pressable>
                <Text style={styles.stepValue}>{payDay}{ordinal(payDay)}</Text>
                <Pressable onPress={() => setPayDay((d) => Math.min(28, d + 1))} hitSlop={6} style={styles.stepBtn} accessibilityLabel="Later">
                  <Feather name="plus" size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.meta}>Payroll opens 3 days before and closes 5 days after.</Text>
            {data.schedule && (
              <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
                <Text style={styles.name}>Pause payroll</Text>
                <Switch
                  value={data.schedule.paused}
                  onValueChange={(v) => run(() => setPayrollSchedule({ payDay, paused: v }))}
                  trackColor={{ true: colors.warning, false: colors.border }}
                />
              </View>
            )}
            <Pressable
              style={[styles.secondary, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => run(() => setPayrollSchedule({ payDay, paused: data.schedule?.paused ?? false }))}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{data.schedule ? 'Save pay day' : 'Set pay day'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  banner: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg },
  bannerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold },
  bannerText: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg },
  cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  progress: { height: 6, borderRadius: 3, backgroundColor: colors.surface, marginVertical: spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.success },
  payout: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text, fontVariant: ['tabular-nums'] },
  status: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  smallBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 6 },
  smallBtnText: { color: colors.onPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm, paddingVertical: 6 },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryOff: { backgroundColor: colors.border },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  blocked: { fontSize: typography.size.sm, color: colors.warning, textAlign: 'center' },
  secondary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  secondaryText: { fontWeight: typography.weight.semibold, color: colors.text },
  section: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.lg },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text, minWidth: 40, textAlign: 'center' },
}));
