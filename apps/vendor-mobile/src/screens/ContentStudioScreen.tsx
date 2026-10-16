import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getStudio, listPosts, mediaSource, type ContentPost, type PostStatus, type StudioInfo } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ContentStudio'>;

const TABS: { id: PostStatus; label: string; empty: string }[] = [
  { id: 'planned', label: 'Planned', empty: 'Nothing planned. Open a draft and pick a day to put it on your calendar.' },
  { id: 'draft', label: 'Drafts', empty: 'No drafts yet. Tap “New post” to write one — with AI or on your own.' },
  { id: 'posted', label: 'Posted', empty: "Posts you've marked as posted show up here." },
];

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export function ContentStudioScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<PostStatus>(route.params?.tab ?? 'planned');
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([listPosts({ status: tab }), getStudio()]);
      setPosts(p); setStudio(s); setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [tab]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Planned posts are grouped by day: this is the content calendar.
  const groups: { label: string; posts: ContentPost[] }[] = [];
  for (const p of posts) {
    const label = tab === 'planned' && p.plannedFor ? dayLabel(p.plannedFor) : '';
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.posts.push(p); else groups.push({ label, posts: [p] });
  }
  const names = new Map(studio?.platforms.map((p) => [p.id, p.name]) ?? []);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Content studio</Text>
          <Pressable style={styles.newBtn} onPress={() => navigation.navigate('PostEditor', {})} accessibilityRole="button">
            <Feather name="plus" size={16} color={colors.white} />
            <Text style={styles.newText}>New post</Text>
          </Pressable>
        </View>
        <View style={styles.chips}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => { setLoading(true); setTab(t.id); }} style={[styles.chip, tab === t.id && styles.chipOn]} accessibilityState={{ selected: tab === t.id }}>
              <Text style={[styles.chipText, tab === t.id && styles.chipTextOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          {studio && studio.platforms.some((p) => p.canConnect && p.publishing === 'manual') && (
            <Pressable style={styles.notice} onPress={() => navigation.navigate('SocialAccounts')} accessibilityRole="button">
              <Feather name="share-2" size={16} color={colors.textSecondary} />
              <Text style={styles.noticeText}>
                {studio.platforms.some((p) => p.connection?.status === 'needs_reconnect') ? 'Your Facebook/Instagram connection needs renewing. Tap to reconnect.' : 'Connect Facebook and Instagram to publish and schedule from Scalio.'}
              </Text>
              <Feather name="chevron-right" size={16} color={colors.textMuted} />
            </Pressable>
          )}
          {studio && !studio.ai.available && (
            <View style={styles.notice}>
              <Feather name="info" size={16} color={colors.textSecondary} />
              <Text style={styles.noticeText}>AI captions aren't switched on yet. You can still write, plan and track posts.</Text>
            </View>
          )}

          {error ? (
            <View style={styles.card}>
              <Text style={styles.meta}>Couldn't load posts. {error}</Text>
              <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.meta}>{TABS.find((t) => t.id === tab)!.empty}</Text>
            </View>
          ) : groups.map((g, gi) => (
            <View key={gi} style={{ gap: spacing.sm }}>
              {g.label ? <Text style={styles.day}>{g.label}</Text> : null}
              {g.posts.map((p) => (
                <Pressable key={p.id} style={styles.post} onPress={() => navigation.navigate('PostEditor', { postId: p.id })} accessibilityRole="button">
                  {p.mediaId ? (
                    <Image source={mediaSource(p.mediaId)} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}><Feather name="type" size={18} color={colors.textMuted} /></View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.caption} numberOfLines={2}>{p.caption || 'No caption yet'}</Text>
                    <Text style={styles.meta}>
                      {p.status === 'planned' && p.plannedFor ? `${timeLabel(p.plannedFor)} · ` : ''}
                      {p.status === 'posted' && p.postedAt ? `Posted ${new Date(p.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ` : ''}
                      {(p.status === 'posted' ? p.postedPlatforms : p.platforms).map((x) => names.get(x) ?? x).join(', ') || 'No platform chosen'}
                    </Text>
                    {p.status !== 'posted' && p.checks.some((c) => c.problems.length > 0) && (
                      <Text style={styles.warn}>Needs changes before posting</Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.mist, borderRadius: radius.md, padding: spacing.md },
  noticeText: { flex: 1, fontSize: typography.size.sm, color: colors.textSecondary },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  day: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.sm },
  post: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surface },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: typography.size.base, color: colors.text, fontWeight: typography.weight.medium },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  warn: { fontSize: typography.size.sm, color: colors.warning, fontWeight: typography.weight.medium },
  retry: { alignSelf: 'flex-start' },
  retryText: { color: colors.accent, fontWeight: typography.weight.bold },
});
