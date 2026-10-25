import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { naira, resolveAccount, setStaffPay, type Bank } from '../lib/api';
import { BankPicker } from '../components/BankPicker';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffPay'>;

/** One person's monthly salary and the account it's paid into (checked with the bank first). */
export function StaffPayScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { staffId, name, pay } = route.params;
  const [salary, setSalary] = useState(pay.monthlySalaryKobo ? String(pay.monthlySalaryKobo / 100) : '');
  const [bank, setBank] = useState<Bank | null>(null);
  const [number, setNumber] = useState('');
  const [checkedName, setCheckedName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setCheckedName(null); setError(''); }, [bank, number]);
  const changingAccount = !!bank || number.length > 0;

  async function check() {
    if (!bank || !/^\d{10}$/.test(number)) { setError('Choose a bank and enter the 10-digit account number.'); return; }
    setBusy(true);
    try { setCheckedName((await resolveAccount(bank.code, number)).accountName); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not check that account.'); }
    finally { setBusy(false); }
  }

  async function save() {
    const amount = Math.round(Number(salary.replace(/,/g, '')) * 100);
    if (salary && (!Number.isFinite(amount) || amount < 0)) { setError('Enter the monthly salary in naira.'); return; }
    if (changingAccount && !checkedName) { setError('Check the account before saving.'); return; }
    setBusy(true);
    try {
      await setStaffPay(staffId, {
        ...(salary ? { monthlySalaryKobo: amount } : {}),
        ...(changingAccount && bank ? { bankCode: bank.code, accountNumber: number } : {}),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Salary and bank account</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { gap: spacing.sm }]}>
          <Text style={styles.label}>Monthly salary (₦)</Text>
          <TextInput style={styles.input} value={salary} onChangeText={(t) => setSalary(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 120000" placeholderTextColor={colors.textMuted} />
          {salary ? <Text style={styles.meta}>{naira(Math.round(Number(salary) * 100) || 0)} a month</Text> : null}
        </View>

        <View style={[styles.card, { gap: spacing.sm }]}>
          <Text style={styles.label}>Bank account</Text>
          {pay.verifiedAt && !changingAccount ? (
            <Text style={styles.current}>{pay.accountName} · {pay.bankName} · •••• {pay.accountLast4}</Text>
          ) : null}
          <BankPicker value={bank} onChange={setBank} />
          <TextInput
            style={styles.input}
            value={number}
            onChangeText={(t) => setNumber(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder={pay.verifiedAt ? 'New 10-digit account number' : '10-digit account number'}
            placeholderTextColor={colors.textMuted}
          />
          {checkedName ? (
            <View style={styles.found}><Feather name="check-circle" size={16} color={colors.success} /><Text style={styles.foundText}>{checkedName}</Text></View>
          ) : changingAccount ? (
            <Pressable style={styles.secondary} onPress={check} disabled={busy}><Text style={styles.secondaryText}>Check account</Text></Pressable>
          ) : null}
          <Text style={styles.meta}>Account numbers are encrypted and only shown in full when you're paying.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={save} disabled={busy} accessibilityRole="button">
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Save</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.xl, gap: spacing.lg },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  current: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  found: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md },
  foundText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  secondary: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  secondaryText: { fontWeight: typography.weight.semibold, color: colors.text },
  error: { fontSize: typography.size.sm, color: colors.error },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
}));
