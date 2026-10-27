import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { ChannelIcon } from '../components/ChannelIcon';
import { TabFrame } from '../components/TabFrame';
import { Avatar, Button, EmptyState, IconButton, PageHeader, PillTabs, TipCard } from '../components/ui';
import { listConversations, type InboxConversation } from '../lib/api';
import { shortTime, windowStatus } from '../lib/inbox';
import { getSession } from '../lib/session';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Filter = 'all' | 'needs_you';

/**
 * One list of chats from Instagram, Messenger and WhatsApp (ADS_MANAGER_PLAN.md §2d).
 * Used as the Inbox tab and as a pushed screen from Marketing.
 */
export function InboxScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isTab = useRoute().name === 'InboxTab';
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

  const needsYou = chats?.filter((c) => c.handoff).length;

  const body = (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.link} />}
    >
      <PageHeader
        title="Inbox"
        description="Messages from Instagram, Messenger and WhatsApp in one place."
        onBack={isTab ? undefined : () => navigation.goBack()}
        actions={canManage ? <IconButton icon="settings" label="AI replies and FAQ" onPress={() => navigation.navigate('InboxSettings')} /> : undefined}
      />
      <PillTabs<Filter>
        options={[
          { key: 'all', label: 'All chats' },
          { key: 'needs_you', label: 'Needs you', count: filter === 'needs_you' ? undefined : needsYou || undefined },
        ]}
        value={filter}
        onChange={(f) => { setChats(null); setFilter(f); }}
      />

      {error && !chats ? (
        <View style={{ gap: 16 }}>
          <TipCard icon="alert-circle" title="Could not load the inbox" body={error} />
          {canManage ? <Button label="Check connected accounts" variant="secondary" onPress={() => navigation.navigate('AdsSetup')} /> : null}
        </View>
      ) : !chats ? (
        <ActivityIndicator color={colors.link} />
      ) : chats.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title={filter === 'needs_you' ? 'Nothing needs you' : 'No chats yet'}
          body={
            filter === 'needs_you'
              ? 'Chats the AI hands to you, like complaints, refunds or questions it can’t answer, show here.'
              : 'When clients message your Instagram or Facebook page, their chats show here.'
          }
          action={filter === 'all' && canManage ? 'Connect accounts' : undefined}
          onAction={() => navigation.navigate('SocialAccounts')}
        />
      ) : (
        <View>
          {chats.map((c) => {
            const w = windowStatus(c.window);
            return (
              <Pressable
                key={c.id}
                onPress={() => navigation.navigate('InboxChat', { conversationId: c.id, name: c.customerName })}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${c.customerName}`}
              >
                <View>
                  <Avatar name={c.customerName} size={56} />
                  <View style={styles.channel}><ChannelIcon channel={c.channel} size={14} /></View>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.name, c.unreadCount > 0 && styles.bold]} numberOfLines={1}>{c.customerName}</Text>
                    <Text style={styles.time}>{shortTime(c.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={[styles.preview, c.unreadCount > 0 && { color: colors.text }]} numberOfLines={1}>{c.preview ?? ''}</Text>
                    {c.unreadCount > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{c.unreadCount}</Text></View> : null}
                  </View>
                  {c.handoff || c.adTitle || w.short ? (
                    <View style={styles.tags}>
                      {c.handoff ? <Tag tone="alert">Needs you · {c.handoff.label}</Tag> : null}
                      {c.adTitle ? <Tag>From ad: {c.adTitle}</Tag> : null}
                      {w.short ? <Tag tone={w.tone === 'warn' ? 'warn' : undefined}>{w.short}</Tag> : null}
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  return isTab ? <TabFrame>{body}</TabFrame> : <StackFrame>{body}</StackFrame>;
}

function StackFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return <View style={[styles.root, { paddingTop: insets.top }]}>{children}</View>;
}

function Tag({ children, tone }: { children: ReactNode; tone?: 'alert' | 'warn' }) {
  const styles = useStyles();
  return <Text style={[styles.tag, tone === 'alert' && styles.tagAlert, tone === 'warn' && styles.tagWarn]}>{children}</Text>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 40, gap: 22 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 12 },
  channel: { position: 'absolute', right: -2, bottom: -2, backgroundColor: colors.background, borderRadius: 10, padding: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  bold: { fontWeight: '700' },
  time: { fontSize: 13, color: colors.textMuted },
  preview: { flex: 1, fontSize: 14, color: colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tag: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  tagAlert: { color: colors.error, backgroundColor: colors.errorLight },
  tagWarn: { color: colors.warning, backgroundColor: colors.warningLight },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: colors.onAccent, fontSize: 12, fontWeight: '700' },
}));
