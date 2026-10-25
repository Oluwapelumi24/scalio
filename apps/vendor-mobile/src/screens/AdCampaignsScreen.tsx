import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listAdCampaigns, mediaSource, type AdCampaign } from '../lib/api';
import { getSession } from '../lib/session';
import { AD_STATUS } from '../lib/ads';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdCampaigns'>;
const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;

/** Your ads: what's running, in review or finished, plus ad credit. */
export function AdCampaignsScreen({ navigation }: Props) {
  const s = useSStyles();
  const { colors } = useTheme();
  const [data, setData] = useState<{ campaigns: AdCampaign[]; creditKobo: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const canManage = ['owner', 'manager'].includes(getSession()?.role ?? '');

  const load = useCallback(async () => {
    try { setData(await listAdCampaigns()); } catch (err) {
      Alert.alert('Could not load your ads', err instanceof Error ? err.message : 'Please try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View style={s.root}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Back"><Feather name="arrow-left" size={20} color={colors.text} /></Pressable>
          <Text style={s.title}>Your ads</Text>
          <Pressable onPress={() => navigation.navigate('AdsSetup')} hitSlop={8} accessibilityLabel="Ads setup"><Feather name="settings" size={18} color={colors.textMuted} /></Pressable>
        </View>
      </SafeAreaView>

      {!data ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        >
          {canManage && (
            <Pressable style={s.create} onPress={() => navigation.navigate('AdCampaignWizard')} accessibilityRole="button">
              <View style={s.createIcon}><Feather name="plus" size={20} color={colors.white} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.createTitle}>Create an ad</Text>
                <Text style={s.createSub}>Get more chats from people near you — about 3 minutes.</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.white} />
            </Pressable>
          )}

          {data.creditKobo > 0 && (
            <View style={s.credit}>
              <Feather name="gift" size={16} color={colors.success} />
              <Text style={s.creditText}>You have {naira(data.creditKobo)} ad credit from unspent budget. It’s used automatically on your next ad.</Text>
            </View>
          )}

          {data.campaigns.length === 0 ? (
            <View style={s.empty}>
              <Feather name="trending-up" size={28} color={colors.accent} />
              <Text style={s.emptyTitle}>No ads yet</Text>
              <Text style={s.muted}>Your first ad can start bringing chats from customers within a day.</Text>
            </View>
          ) : data.campaigns.map((c) => {
            const st = AD_STATUS(colors)[c.status];
            const spentPct = c.paidSpendKobo > 0 ? Math.min(1, c.spentKobo / c.paidSpendKobo) : 0;
            return (
              <Pressable key={c.id} style={s.card} onPress={() => navigation.navigate('AdCampaign', { id: c.id })} accessibilityRole="button">
                {c.mediaId ? <Image source={mediaSource(c.mediaId)} style={s.thumb} /> : <View style={[s.thumb, { backgroundColor: colors.mist }]} />}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                  <View style={s.rowGap}>
                    <View style={[s.status, { backgroundColor: st.bg }]}><Text style={[s.statusText, { color: st.fg }]}>{st.label}</Text></View>
                    <Text style={s.muted}>{c.objectiveLabel}</Text>
                  </View>
                  <Text style={s.muted}>{naira(c.dailyBudgetKobo)}/day · ends {new Date(c.endAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                  {c.route === 'scalio' && c.paidSpendKobo > 0 && (
                    <View style={s.track}><View style={[s.fill, { width: `${Math.round(spentPct * 100)}%` }]} /></View>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const useSStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  title: { flex: 1, fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  create: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.lg },
  createIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  createTitle: { color: colors.white, fontSize: typography.size.md, fontWeight: typography.weight.semibold },
  createSub: { color: colors.onDarkMuted, fontSize: typography.size.sm },
  credit: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  creditText: { flex: 1, fontSize: typography.size.sm, color: colors.text },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statusText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  muted: { fontSize: typography.size.sm, color: colors.textMuted },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.mist, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', backgroundColor: colors.success },
}));
