import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  chooseAdAccount, getAdsSetup, getMetaAdAccounts, metaConnectUrl, refreshAdAccount,
  type AdsSetup, type AdsSetupStep, type MetaAdAccountOption,
} from '../lib/api';
import { getSession } from '../lib/session';
import { radius, spacing, typography, useTheme, makeStyles, type Colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdsSetup'>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICONS: Record<AdsSetupStep['key'], FeatherName> = {
  facebook: 'facebook', instagram: 'instagram', ad_access: 'shield', ad_account: 'briefcase', payment_method: 'credit-card', whatsapp: 'message-circle',
};

const STATE_ICON = (colors: Colors): Record<AdsSetupStep['state'], { icon: FeatherName; color: string } | null> => ({
  done: { icon: 'check-circle', color: colors.success },
  attention: { icon: 'alert-circle', color: colors.error },
  todo: null,
  waiting: null,
  coming_soon: null,});

function actionLabel(step: AdsSetupStep): string {
  const a = step.action!;
  if (a.kind === 'open_url') return a.label;
  if (a.kind === 'choose_ad_account') return step.state === 'done' ? 'Change' : 'Choose ad account';
  return step.state === 'attention' || step.key !== 'facebook' ? 'Reconnect Facebook' : 'Connect Facebook';
}

/** "Connect your accounts" — the checklist before a business can run ads (ADS_MANAGER_PLAN.md §2a). */
export function AdsSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [setup, setSetup] = useState<AdsSetup | null>(null);
  const [accounts, setAccounts] = useState<MetaAdAccountOption[] | null>(null);
  const [busy, setBusy] = useState(false);
  const canManage = ['owner', 'manager'].includes(getSession()?.role ?? '');
  // Set when the person leaves for Meta's payment page, so coming back re-checks the card.
  const recheckOnReturn = useRef(false);

  const load = useCallback(async () => {
    try { setSetup(await getAdsSetup()); } catch (err) {
      Alert.alert('Could not load ads setup', err instanceof Error ? err.message : 'Please try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Facebook login and Meta's payment page open in the browser; refresh when the app comes back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      if (recheckOnReturn.current) {
        recheckOnReturn.current = false;
        refreshAdAccount().then(setSetup).catch(() => void load());
      } else {
        void load();
      }
    });
    return () => sub.remove();
  }, [load]);

  async function run(step: AdsSetupStep) {
    const a = step.action;
    if (!a) return;
    setBusy(true);
    try {
      if (a.kind === 'connect') {
        const { url } = await metaConnectUrl();
        await Linking.openURL(url);
      } else if (a.kind === 'open_url') {
        recheckOnReturn.current = true;
        await Linking.openURL(a.url);
      } else {
        setAccounts(await getMetaAdAccounts());
      }
    } catch (err) {
      Alert.alert('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function pick(a: MetaAdAccountOption) {
    setBusy(true);
    try {
      setSetup(await chooseAdAccount(a.id));
      setAccounts(null);
    } catch (err) {
      Alert.alert('Could not choose that ad account', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function recheck() {
    setBusy(true);
    try { setSetup(await refreshAdAccount()); } catch (err) {
      Alert.alert('Could not check with Meta', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  const required = setup?.steps.filter((s) => !s.optional) ?? [];
  const doneCount = required.filter((s) => s.state === 'done').length;
  const hasAccount = setup?.steps.some((s) => s.key === 'payment_method' || (s.key === 'ad_account' && s.state !== 'todo' && s.state !== 'waiting'));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Ads</Text>
        <Text style={styles.subtitle}>Get more customers with Facebook and Instagram ads. First, connect your accounts — it takes about two minutes.</Text>
      </SafeAreaView>

      {!setup ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView contentContainerStyle={styles.content}>
          {!setup.available && (
            <View style={styles.note}><Text style={styles.meta}>{setup.unavailableReason}</Text></View>
          )}

          <View style={[styles.banner, setup.ready && styles.bannerReady]}>
            <Feather name={setup.ready ? 'check-circle' : 'list'} size={18} color={setup.ready ? colors.success : colors.accent} />
            <Text style={styles.bannerText}>
              {setup.ready ? 'You’re ready to run ads.' : `${doneCount} of ${required.length} required steps done`}
            </Text>
          </View>

          {setup.ready && (
            <View style={styles.readyRow}>
              {canManage && (
                <Pressable style={styles.readyPrimary} onPress={() => navigation.navigate('AdCampaignWizard')} accessibilityRole="button">
                  <Feather name="plus" size={16} color={colors.white} />
                  <Text style={styles.readyPrimaryText}>Create an ad</Text>
                </Pressable>
              )}
              <Pressable style={styles.readySecondary} onPress={() => navigation.navigate('AdCampaigns')} accessibilityRole="button">
                <Text style={styles.actionText}>Your ads</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.card}>
            {setup.steps.map((s, i) => {
              const mark = STATE_ICON(colors)[s.state];
              const muted = s.state === 'waiting' || s.state === 'coming_soon';
              return (
                <View key={s.key} style={[styles.row, i > 0 && styles.divider]}>
                  <Feather name={ICONS[s.key]} size={20} color={muted ? colors.textMuted : colors.text} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.name, muted && { color: colors.textMuted }]}>{s.title}</Text>
                      {s.optional && s.state !== 'done' && <Text style={styles.tag}>{s.state === 'coming_soon' ? 'Coming soon' : 'Optional'}</Text>}
                    </View>
                    <Text style={[styles.meta, s.state === 'attention' && { color: colors.error }]}>{s.detail}</Text>
                    {s.action && canManage && setup.available && (
                      <Pressable onPress={() => void run(s)} disabled={busy} style={[styles.action, busy && styles.disabled]} accessibilityRole="button">
                        <Text style={styles.actionText}>{actionLabel(s)}</Text>
                        <Feather name={s.action.kind === 'open_url' ? 'external-link' : 'chevron-right'} size={14} color={colors.accent} />
                      </Pressable>
                    )}
                  </View>
                  {mark && <Feather name={mark.icon} size={18} color={mark.color} />}
                </View>
              );
            })}
          </View>

          {accounts && (
            <View style={styles.card}>
              <Text style={[styles.name, { paddingTop: spacing.lg }]}>Choose your ad account</Text>
              {accounts.length === 0 ? (
                <Text style={[styles.meta, { paddingVertical: spacing.lg }]}>
                  Your Facebook login has no ad accounts. That’s fine — skip this and pay for ads with Scalio when you launch one.
                </Text>
              ) : accounts.map((a) => (
                <Pressable key={a.id} onPress={() => void pick(a)} disabled={busy} style={[styles.row, styles.divider]} accessibilityRole="button">
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name}>{a.name}</Text>
                    <Text style={styles.meta}>
                      {[a.businessName, a.currency, a.hasPaymentMethod ? (a.paymentMethodLabel ?? 'Card added') : 'No card yet'].filter(Boolean).join(' · ')}
                    </Text>
                    {a.problem && <Text style={[styles.meta, { color: colors.error }]}>{a.problem}</Text>}
                  </View>
                  {a.chosen ? <Feather name="check" size={18} color={colors.success} /> : <Feather name="chevron-right" size={18} color={colors.textMuted} />}
                </Pressable>
              ))}
              <Pressable onPress={() => setAccounts(null)} style={{ paddingVertical: spacing.md }}><Text style={styles.actionText}>Cancel</Text></Pressable>
            </View>
          )}

          {!canManage && <Text style={styles.meta}>Ask an owner or manager to connect accounts for ads.</Text>}

          {hasAccount && canManage && setup.available && (
            <Pressable onPress={() => void recheck()} disabled={busy} style={{ alignSelf: 'flex-start' }}>
              <Text style={styles.actionText}>Check my ad account again</Text>
            </Pressable>
          )}

          <View style={styles.note}>
            <Text style={styles.noteTitle}>Two ways to pay for ads</Text>
            <Text style={styles.meta}>
              Pay with Scalio by card, bank transfer or USSD in naira — no dollar card needed. Or, if you already have a Meta ad account with a card Meta accepts, Meta can charge that card directly. You’ll choose when you launch an ad.
            </Text>
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
  subtitle: { fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: spacing.xs },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accentLight, borderRadius: radius.md, padding: spacing.md },
  bannerReady: { backgroundColor: colors.successLight },
  bannerText: { flex: 1, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.lg },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  tag: { fontSize: typography.size.xs, color: colors.textMuted, backgroundColor: colors.mist, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: spacing.xs },
  actionText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  disabled: { opacity: 0.5 },
  readyRow: { flexDirection: 'row', gap: spacing.sm },
  readyPrimary: { flex: 1, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.md },
  readyPrimaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  readySecondary: { paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent },
  note: { backgroundColor: colors.mist, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  noteTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.text },
}));
