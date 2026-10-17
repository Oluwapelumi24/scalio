import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ChannelIcon } from '../components/ChannelIcon';
import { listConversations, type InboxConversation } from '../lib/api';
import { shortTime, windowStatus } from '../lib/inbox';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Inbox'>;
type Filter = 'all' | 'needs_you';

/** One list of chats from Instagram, Messenger and WhatsApp (ADS_MANAGER_PLAN.md §2d). */
export function InboxScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [chats, setChats] = useState<InboxConversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const canManage = ['owner', 'manager'].includes(getSession()?.role ?? '');

  const load = useCallback(async () => {
    try {
      setChats(await listConversations(filter));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the inbox.');
    }
  }, [filter]);

  // New messages arrive through Meta's webhooks; check every 10 seconds while the inbox is open.
  useFocusEffect(useCallback(() => {
    void load();
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [load]));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          {canManage && (
            <Pressable onPress={() => navigation.navigate('InboxSettings')} style={styles.iconBtn} hitSlop={8} accessibilityLabel="AI replies and FAQ">
              <Feather name="settings" size={20} color={colors.text} />
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>Messages from Instagram, Messenger and WhatsApp in one place.</Text>
        <View style={styles.chips}>
          {(['all', 'needs_you'] as const).map((f) => (
            <Pressable key={f} onPress={() => { setChats(null); setFilter(f); }} style={[styles.chip, filter === f && styles.chipOn]} accessibilityState={{ selected: filter === f }}>
              <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>{f === 'all' ? 'All chats' : 'Needs you'}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {error && !chats ? (
        <View style={styles.content}>
          <View style={styles.note}><Text style={styles.meta}>{error}</Text></View>
          {canManage && (
            <Pressable onPress={() => navigation.navigate('AdsSetup')}><Text style={styles.link}>Check your connected accounts</Text></Pressable>
          )}
        </View>
      ) : !chats ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
          {chats.length === 0 ? (
            <View style={styles.card}>
              <Text style={[styles.meta, { paddingVertical: spacing.lg }]}>
                {filter === 'needs_you'
                  ? 'Nothing needs you right now. Chats the AI hands to you — complaints, refunds, questions it can’t answer — show here.'
                  : 'No chats yet. When customers message your Instagram or Facebook Page, they’ll show here.'}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {chats.map((c, i) => {
                const w = windowStatus(c.window);
                return (
                  <Pressable key={c.id} onPress={() => navigation.navigate('InboxChat', { conversationId: c.id, name: c.customerName })}
                    style={[styles.row, i > 0 && styles.divider]} accessibilityRole="button" accessibilityLabel={`Chat with ${c.customerName}`}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.customerName.slice(0, 1).toUpperCase()}</Text>
                      <View style={styles.badge}><ChannelIcon channel={c.channel} size={13} /></View>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.name, c.unreadCount > 0 && styles.bold]} numberOfLines={1}>{c.customerName}</Text>
                        <Text style={styles.time}>{shortTime(c.lastMessageAt)}</Text>
                      </View>
                      <Text style={[styles.meta, c.unreadCount > 0 && { color: colors.text }]} numberOfLines={1}>{c.preview ?? ''}</Text>
                      <View style={styles.tags}>
                        {c.handoff && <Text style={[styles.tag, styles.tagAlert]}>Needs you · {c.handoff.label}</Text>}
                        {c.adTitle && <Text style={styles.tag}>From ad: {c.adTitle}</Text>}
                        {w.short ? <Text style={[styles.tag, w.tone === 'warn' && styles.tagWarn]}>{w.short}</Text> : null}
                      </View>
                    </View>
                    {c.unreadCount > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{c.unreadCount}</Text></View>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  iconBtn: { width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.accent },
  badge: { position: 'absolute', right: -4, bottom: -4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  bold: { fontWeight: typography.weight.bold },
  time: { fontSize: typography.size.xs, color: colors.textMuted },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: typography.size.xs, color: colors.textSecondary, backgroundColor: colors.mist, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  tagAlert: { color: colors.error, backgroundColor: colors.errorLight },
  tagWarn: { color: colors.warning, backgroundColor: colors.warningLight },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: colors.white, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  note: { backgroundColor: colors.mist, borderRadius: radius.md, padding: spacing.md },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
});
