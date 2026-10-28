import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getPayoutAccount, resolveAccount, setPayoutAccount, type Bank, type PayoutAccount } from '../lib/api';
import { getSession } from '../lib/session';
import { BankPicker } from '../components/BankPicker';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentsSetup'>;

/**
 * Where customers' online payments go. Paystack settles them straight to this
 * account — Scalio never holds the money. Only the owner can change it.
 */
export function PaymentsSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isOwner = getSession()?.role === 'owner';
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bank, setBank] = useState<Bank | null>(null);
  const [number, setNumber] = useState('');
  const [checkedName, setCheckedName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const a = await getPayoutAccount();
      setAccount(a);
      setEditing(!a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your payment account.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Any change to the bank or number means the name must be checked again.
  useEffect(() => { setCheckedName(null); setError(''); }, [bank, number]);

  async function check() {
    if (!bank || !/^\d{10}$/.test(number)) {
      setError('Choose a bank and enter the 10-digit account number.');
      return;
    }
    setBusy(true);
    try {
      setCheckedName((await resolveAccount(bank.code, number)).accountName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check that account.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!bank || !checkedName) return;
    setBusy(true);
    try {
      setAccount(await setPayoutAccount(bank.code, number));
      setEditing(false);
      setNumber('');
      Alert.alert('Saved', 'Customers can now pay online, and the money goes straight to this account.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Online payments</Text>
        <Text style={styles.subtitle}>Where customers' deposits and payments go</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.note}>
            <Feather name="shield" size={16} color={colors.accent} />
            <Text style={styles.noteText}>
              Paystack pays customers' money straight into your bank account. Scalio never holds it.
            </Text>
          </View>

          {account && !editing && (
            <View style={styles.card}>
              <Text style={styles.label}>Paid into</Text>
              <Text style={styles.big}>{account.accountName}</Text>
              <Text style={styles.meta}>{account.bankName} · •••• {account.accountLast4}</Text>
              <View style={[styles.pill, account.onlinePaymentsEnabled ? styles.pillOn : styles.pillOff]}>
                <Text style={[styles.pillText, { color: account.onlinePaymentsEnabled ? colors.success : colors.warning }]}>
                  {account.onlinePaymentsEnabled ? 'Online payments on' : 'Waiting for Paystack'}
                </Text>
              </View>
              {isOwner && (
                <Pressable style={styles.secondary} onPress={() => setEditing(true)} accessibilityRole="button">
                  <Text style={styles.secondaryText}>Change account</Text>
                </Pressable>
              )}
            </View>
          )}

          {editing && (
            isOwner ? (
              <View style={[styles.card, { gap: spacing.md }]}>
                <Text style={styles.label}>Bank</Text>
                <BankPicker value={bank} onChange={setBank} />
                <Text style={styles.label}>Account number</Text>
                <TextInput
                  style={styles.input}
                  value={number}
                  onChangeText={(t) => setNumber(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  placeholder="10-digit account number"
                  placeholderTextColor={colors.textMuted}
                />
                {checkedName && (
                  <View style={styles.found}>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <Text style={styles.foundText}>{checkedName}</Text>
                  </View>
                )}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {checkedName ? (
                  <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={save} disabled={busy} accessibilityRole="button">
                    {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Use this account</Text>}
                  </Pressable>
                ) : (
                  <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={check} disabled={busy} accessibilityRole="button">
                    {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Check account</Text>}
                  </Pressable>
                )}
                {account && (
                  <Pressable onPress={() => setEditing(false)} style={{ alignSelf: 'center' }}>
                    <Text style={styles.link}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={styles.meta}>Only the business owner can add the account payments go to.</Text>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 22, letterSpacing: -0.6, lineHeight: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.xl, gap: spacing.lg },
  note: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.accentLight, borderRadius: radius.lg, padding: spacing.lg },
  noteText: { flex: 1, fontSize: typography.size.sm, color: colors.text, lineHeight: 19 },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg, gap: 4 },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  big: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginTop: 2 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.sm },
  pillOn: { backgroundColor: colors.successLight },
  pillOff: { backgroundColor: colors.warningLight },
  pillText: { fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text, backgroundColor: colors.background },
  found: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md },
  foundText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  error: { fontSize: typography.size.sm, color: colors.error },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  secondary: { alignSelf: 'flex-start', marginTop: spacing.md, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  secondaryText: { fontWeight: typography.weight.semibold, color: colors.text },
  link: { color: colors.accent, fontWeight: typography.weight.semibold },
}));
