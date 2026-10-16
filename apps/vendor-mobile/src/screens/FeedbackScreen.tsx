import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getFeedback, markFeedbackFollowedUp, whatsappUrl, type FeedbackItem, type FeedbackOverview } from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PERIODS = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '365', label: 'Last year', days: 365 },
] as const;

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <Feather key={n} name="star" size={size} color={n <= Math.round(value) ? colors.warning : colors.border} />)}
    </View>
  );
}

export function FeedbackScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('30');
  const [data, setData] = useState<FeedbackOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const practitioner = getSession()?.role === 'practitioner';

  const load = useCallback(async () => {
    const days = PERIODS.find((p) => p.id === period)!.days;
    const now = new Date();
    try {
      setData(await getFeedback(iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))), iso(now)));
      setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); } finally { setRefreshing(false); }
  }, [period]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function followedUp(item: FeedbackItem) {
    try { await markFeedbackFollowedUp(item.id); await load(); } catch (err) {
      Alert.alert('Could not update', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  const max = Math.max(...(data?.distribution.map((d) => d.count) ?? [1]), 1);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Customer feedback</Text>
        <Text style={styles.subtitle}>
          {practitioner ? 'Ratings for your appointments.' : 'Customers rate their visit after each completed booking.'} Ratings are private to your business.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PERIODS.map((p) => (
            <Pressable key={p.id} onPress={() => setPeriod(p.id)} style={[styles.chip, period === p.id && styles.chipOn]} accessibilityState={{ selected: period === p.id }}>
              <Text style={[styles.chipText, period === p.id && styles.chipTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      {error ? <Text style={[styles.meta, { padding: spacing.xl }]}>Couldn't load feedback. {error}</Text>
        : !data ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
          <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
            <View style={styles.card}>
              <View style={styles.summary}>
                <View style={{ alignItems: 'center', gap: 4, minWidth: 90 }}>
                  <Text style={styles.big}>{data.average ?? '—'}</Text>
                  {data.average !== null && <Stars value={data.average} />}
                  <Text style={styles.meta}>{data.count} rating{data.count === 1 ? '' : 's'}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  {[...data.distribution].reverse().map((d) => (
                    <View key={d.stars} style={styles.distRow}>
                      <Text style={styles.distLabel}>{d.stars}★</Text>
                      <View style={styles.track}><View style={[styles.fill, { width: `${(d.count / max) * 100}%` }]} /></View>
                      <Text style={styles.distCount}>{d.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.meta}>
                {data.asked} customer{data.asked === 1 ? ' was' : 's were'} asked in this period. Customers with an email get the link automatically; for others, open a completed booking and send it on WhatsApp.
              </Text>
            </View>

            {data.items.length === 0 ? (
              <View style={styles.card}><Text style={styles.meta}>No ratings yet for this period.</Text></View>
            ) : data.items.map((f) => (
              <View key={f.id} style={[styles.card, f.needsFollowUp && styles.alert]}>
                <View style={styles.itemHead}>
                  <Stars value={f.rating} size={16} />
                  <Text style={styles.meta}>{new Date(f.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                </View>
                {f.comment ? <Text style={styles.comment}>“{f.comment}”</Text> : null}
                <Text style={styles.meta}>
                  {f.customer.name} · visit {new Date(f.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{f.staffName ? ` · ${f.staffName}` : ''}
                </Text>
                {f.needsFollowUp && (
                  <View style={styles.actions}>
                    {f.customer.phone && (
                      <Pressable style={styles.action} onPress={() => Linking.openURL(`tel:${f.customer.phone}`)}><Feather name="phone" size={14} color={colors.accent} /><Text style={styles.actionText}>Call</Text></Pressable>
                    )}
                    {f.customer.phone && (
                      <Pressable style={styles.action} onPress={() => Linking.openURL(whatsappUrl(f.customer.phone, `Hi ${f.customer.name.split(' ')[0]}, thank you for your feedback. We're sorry your visit wasn't great — could we make it right?`))}>
                        <Feather name="message-circle" size={14} color={colors.accent} /><Text style={styles.actionText}>WhatsApp</Text>
                      </Pressable>
                    )}
                    {!practitioner && (
                      <Pressable style={styles.action} onPress={() => followedUp(f)}><Feather name="check" size={14} color={colors.accent} /><Text style={styles.actionText}>Done, followed up</Text></Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 36, height: 36, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  alert: { borderColor: colors.warning, backgroundColor: colors.warningLight },
  summary: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  big: { fontSize: 36, fontWeight: typography.weight.bold, color: colors.text },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  distLabel: { width: 24, fontSize: typography.size.xs, color: colors.textSecondary },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.warning },
  distCount: { width: 24, textAlign: 'right', fontSize: typography.size.xs, color: colors.textMuted },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comment: { fontSize: typography.size.base, color: colors.text, lineHeight: 20 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  actionText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
});
