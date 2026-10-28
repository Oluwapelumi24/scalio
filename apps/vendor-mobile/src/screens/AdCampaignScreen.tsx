import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { StepProgress } from '../components/StepProgress';
import { cancelAdCampaign, checkoutAdCampaign, extendAdCampaign, getAdCampaign, mediaSource, retryAdCampaign, type AdCampaignDetail } from '../lib/api';
import { AD_JOURNEY, AD_STATUS, journeyIndex } from '../lib/ads';
import { getSession } from '../lib/session';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdCampaign'>;
const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** One ad: where it is (paid → in review → live → finished), what it cost, and extend / pay / retry. */
export function AdCampaignScreen({ navigation, route }: Props) {
  const s = useSStyles();
  const { colors } = useTheme();
  const { id } = route.params;
  const [c, setC] = useState<AdCampaignDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const canManage = ['owner', 'manager'].includes(getSession()?.role ?? '');

  const load = useCallback(async () => {
    try { setC(await getAdCampaign(id)); } catch (err) {
      Alert.alert('Could not load this ad', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Paystack opens in the browser; coming back refreshes. While Meta is working on it, check every few seconds.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') void load(); });
    return () => sub.remove();
  }, [load]);
  useEffect(() => {
    if (!c || !['awaiting_payment', 'launching'].includes(c.status)) return;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [c, load]);

  async function act(title: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try { await fn(); await load(); } catch (err) {
      Alert.alert(title, err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  const pay = () => act('Could not start payment', async () => {
    const r = await checkoutAdCampaign(id);
    if (!r.paid && r.authorizationUrl) await Linking.openURL(r.authorizationUrl);
  });

  const extend = (days: number) => {
    const q = c!.quoteForExtension[String(days)];
    Alert.alert(
      `Run ${days} more days?`,
      q.route === 'scalio' ? `You’ll pay ${naira(q.dueNowKobo)} (spend + VAT + Scalio fee).` : `You’ll pay Scalio’s fee of ${naira(q.dueNowKobo)}; Meta charges your card for the extra spend.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Extend', onPress: () => void act('Could not extend', async () => {
          const r = await extendAdCampaign(id, days);
          if (!r.paid && r.authorizationUrl) await Linking.openURL(r.authorizationUrl);
        }) },
      ],
    );
  };

  if (!c) return <View style={[s.root, s.center]}><ActivityIndicator color={colors.accent} /></View>;
  const st = AD_STATUS(colors)[c.status];
  const journey = journeyIndex(c.status);
  const canExtend = canManage && ['in_review', 'active', 'paused', 'completed'].includes(c.status);
  const spentPct = c.paidSpendKobo > 0 ? Math.min(1, c.spentKobo / c.paidSpendKobo) : 0;

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Back"><Feather name="arrow-left" size={20} color={colors.text} /></Pressable>
          <Text style={s.title} numberOfLines={1}>{c.name}</Text>
        </View>
        {journey !== null ? <StepProgress steps={AD_JOURNEY} current={journey} /> : (
          <View style={[s.banner, { backgroundColor: st.bg }]}>
            <Feather name="alert-circle" size={16} color={st.fg} />
            <Text style={[s.bannerText, { color: st.fg }]}>{st.label}</Text>
          </View>
        )}
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content}>
        {c.status === 'awaiting_payment' && (
          <Notice icon="credit-card" text="This ad isn’t paid for yet. Pay to send it to Meta for review." action={canManage ? { label: 'Pay now', onPress: pay } : undefined} busy={busy} />
        )}
        {c.status === 'launching' && <Notice icon="loader" text="Payment received. We’re sending your ad to Meta…" />}
        {c.status === 'in_review' && <Notice icon="clock" text="Meta is reviewing your ad. This usually takes a few hours, at most a day." />}
        {c.status === 'rejected' && (
          <Notice icon="x-circle" tone="error" text={`Meta didn’t approve this ad.${c.reviewNote ? ` Meta said: ${c.reviewNote}` : ''}${c.route === 'scalio' ? ' Unspent money has come back as ad credit — create a new ad to use it.' : ''}`} />
        )}
        {c.status === 'failed' && (
          <Notice
            icon="alert-triangle" tone="error" busy={busy}
            text={`Your ad is paid for, but Meta didn’t accept it yet. ${c.lastError ? c.lastError.replace(/[.\s]*$/, '.') : ''} Fix it and try again — you won’t pay twice.`}
            action={canManage ? { label: 'Try again', onPress: () => void act('Still not accepted', () => retryAdCampaign(id)) } : undefined}
          />
        )}

        <View style={s.card}>
          {c.mediaId && <Image source={mediaSource(c.mediaId)} style={s.photo} />}
          <Text style={s.headline}>{c.creative.headline}</Text>
          <Text style={s.muted}>{c.creative.primaryText}</Text>
        </View>

        <View style={s.card}>
          <Row label="Goal" value={c.objectiveLabel} />
          <Row label="Budget" value={`${naira(c.dailyBudgetKobo)} a day`} />
          <Row label="Runs" value={`${day(c.startAt)} → ${day(c.endAt)} (${c.days} days)`} />
          <Row label="Paid via" value={c.route === 'scalio' ? 'Scalio' : 'Your Meta ad account'} />
          {c.launchedAt && (
            <>
              <Row label="Spent so far" value={c.route === 'scalio' ? `${naira(c.spentKobo)} of ${naira(c.paidSpendKobo)}` : naira(c.spentKobo)} />
              {c.route === 'scalio' && <View style={s.track}><View style={[s.fill, { width: `${Math.round(spentPct * 100)}%` }]} /></View>}
            </>
          )}
        </View>

        {canExtend && (
          <View style={s.card}>
            <Text style={s.headline}>Keep it running</Text>
            <Text style={s.muted}>Add more days — same daily budget.</Text>
            <View style={s.chips}>
              {[7, 14, 30].map((d) => (
                <Pressable key={d} style={[s.chip, busy && { opacity: 0.5 }]} onPress={() => extend(d)} disabled={busy}>
                  <Text style={s.chipText}>+{d} days</Text>
                  <Text style={s.chipSub}>{naira(c.quoteForExtension[String(d)].dueNowKobo)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {canManage && ['awaiting_payment', 'failed'].includes(c.status) && (
          <Pressable onPress={() => Alert.alert('Cancel this ad?', c.status === 'failed' && c.route === 'scalio' ? 'What you paid for ad spend comes back as ad credit.' : undefined, [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Cancel ad', style: 'destructive', onPress: () => void act('Could not cancel', () => cancelAdCampaign(id)) },
          ])}>
            <Text style={s.danger}>Cancel this ad</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function Notice({ icon, text, tone, action, busy }: { icon: React.ComponentProps<typeof Feather>['name']; text: string; tone?: 'error'; action?: { label: string; onPress: () => void }; busy?: boolean }) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.notice, tone === 'error' && { backgroundColor: colors.errorLight }]}>
      <Feather name={icon} size={16} color={tone === 'error' ? colors.error : colors.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Text style={s.noticeText}>{text}</Text>
        {action && (
          <Pressable onPress={action.onPress} disabled={busy} style={[s.noticeBtn, busy && { opacity: 0.5 }]}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={s.noticeBtnText}>{action.label}</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => {
  const s = useSStyles();
  return (
  <View style={s.row}><Text style={s.muted}>{label}</Text><Text style={s.value}>{value}</Text></View>);
};

const useSStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  title: { flex: 1, fontSize: 22, letterSpacing: -0.6, lineHeight: 28, fontWeight: '700', color: colors.text },
  banner: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md },
  bannerText: { fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  notice: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.accentLight, borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: typography.size.sm, color: colors.text, lineHeight: 19 },
  noticeBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 8 },
  noticeBtnText: { color: colors.onPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  card: { backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  photo: { width: '100%', aspectRatio: 1.6, borderRadius: radius.md },
  headline: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  muted: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  value: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text, flexShrink: 1, textAlign: 'right' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.mist, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.success },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.accent, gap: 2 },
  chipText: { fontWeight: typography.weight.semibold, color: colors.accent, fontSize: typography.size.sm },
  chipSub: { fontSize: typography.size.xs, color: colors.textMuted },
  danger: { color: colors.error, fontWeight: typography.weight.medium, fontSize: typography.size.sm, textAlign: 'center' },
}));
