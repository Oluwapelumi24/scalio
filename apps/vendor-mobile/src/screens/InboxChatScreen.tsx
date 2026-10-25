import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ChannelIcon } from '../components/ChannelIcon';
import {
  AI_MODE_LABELS, CHANNEL_LABELS, getConversation, sendInboxReply, setConversationAiPaused, suggestInboxReply,
  type InboxConversationDetail, type InboxMessage,
} from '../lib/api';
import { shortTime, windowStatus } from '../lib/inbox';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InboxChat'>;

const SENDER_LABEL: Record<InboxMessage['sentBy'], string> = { customer: '', vendor: 'You', ai: 'AI' };

/** One chat, with the 24-hour reply timer and the AI controls for this chat. */
export function InboxChatScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { conversationId } = route.params;
  const [chat, setChat] = useState<InboxConversationDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'send' | 'suggest' | 'ai' | null>(null);
  const [, setTick] = useState(0);
  const scroll = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try { setChat(await getConversation(conversationId)); } catch (err) {
      Alert.alert('Could not load this chat', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [conversationId]);

  // Poll for new messages while open; the timer text refreshes with it.
  useFocusEffect(useCallback(() => {
    void load();
    const t = setInterval(() => { void load(); setTick((n) => n + 1); }, 8_000);
    return () => clearInterval(t);
  }, [load]));

  // An AI suggestion lands in the composer, ready to edit — unless the vendor is already typing.
  const lastSuggestion = useRef<string | null>(null);
  useEffect(() => {
    const s = chat?.aiSuggestion ?? null;
    if (s && s !== lastSuggestion.current && !draft.trim()) setDraft(s);
    lastSuggestion.current = s;
  }, [chat?.aiSuggestion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setBusy('send');
    try {
      setChat(await sendInboxReply(conversationId, text));
      setDraft('');
    } catch (err) {
      Alert.alert('Not sent', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  async function suggest() {
    setBusy('suggest');
    try {
      const r = await suggestInboxReply(conversationId);
      if (r.suggestion) setDraft(r.suggestion);
      else if (r.handoff) Alert.alert('Best answered by you', `${r.handoff.label}, so the AI won’t suggest a reply.`);
    } catch (err) {
      Alert.alert('No suggestion', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  async function setPaused(paused: boolean) {
    setBusy('ai');
    try { setChat(await setConversationAiPaused(conversationId, paused)); } catch (err) {
      Alert.alert('Could not change the AI', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  const w = chat ? windowStatus(chat.window) : null;
  const canReply = chat ? chat.window.state === 'open' || chat.window.state === 'human_agent' : false;
  const aiOn = chat ? chat.aiMode !== 'off' && !chat.aiPaused : false;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{chat?.customerName ?? route.params.name ?? 'Chat'}</Text>
            {chat && (
              <View style={styles.channelRow}>
                <ChannelIcon channel={chat.channel} size={12} />
                <Text style={styles.meta}>{CHANNEL_LABELS[chat.channel]}{chat.adTitle ? ` · From ad: ${chat.adTitle}` : ''}</Text>
              </View>
            )}
          </View>
          {chat?.leadId && (
            <Pressable onPress={() => navigation.navigate('LeadDetail', { leadId: chat.leadId! })} hitSlop={8} accessibilityLabel="Open lead">
              <Feather name="user" size={20} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {chat && w && (
          <View style={[styles.timer, w.tone === 'warn' && styles.timerWarn, w.tone === 'closed' && styles.timerClosed]}>
            <Feather name="clock" size={14} color={w.tone === 'ok' ? colors.success : w.tone === 'warn' ? colors.warning : colors.textMuted} />
            <Text style={styles.timerText}>{w.long}</Text>
          </View>
        )}

        {chat && (
          <View style={styles.aiRow}>
            <Feather name="cpu" size={14} color={aiOn ? colors.accent : colors.textMuted} />
            <Text style={[styles.meta, { flex: 1 }]}>
              {chat.aiMode === 'off' ? `AI is off for ${CHANNEL_LABELS[chat.channel]}`
                : chat.aiPaused ? 'AI is paused for this chat' : `AI: ${AI_MODE_LABELS[chat.aiMode]}`}
            </Text>
            {chat.aiMode !== 'off' && (
              <Pressable onPress={() => void setPaused(!chat.aiPaused)} disabled={busy !== null} hitSlop={6}>
                <Text style={styles.link}>{chat.aiPaused ? 'Turn on for this chat' : 'Pause for this chat'}</Text>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>

      {!chat ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <>
          {chat.handoff && (
            <View style={styles.handoff}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.timerText, { flex: 1 }]}>{chat.handoff.label}. The AI has stopped — please reply yourself.</Text>
            </View>
          )}
          <ScrollView ref={scroll} contentContainerStyle={styles.thread} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
            {chat.messages.map((m) => {
              const mine = m.direction === 'out';
              return (
                <View key={m.id} style={[styles.bubbleWrap, mine && { alignItems: 'flex-end' }]}>
                  <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn, m.sentBy === 'ai' && styles.bubbleAi]}>
                    {m.text ? <Text style={[styles.bubbleText, mine && m.sentBy !== 'ai' && { color: colors.white }]}>{m.text}</Text> : null}
                    {m.attachments.map((a, i) => (
                      <Text key={i} style={[styles.meta, mine && m.sentBy !== 'ai' && { color: colors.onDarkMuted }]}>
                        {a.type === 'image' ? '📷 Photo' : a.type === 'audio' ? '🎤 Voice note' : '📎 Attachment'}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.stamp}>
                    {[SENDER_LABEL[m.sentBy], shortTime(m.sentAt), m.humanAgentTag ? 'human reply' : null, m.status === 'failed' ? 'not sent' : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.composer}>
            {canReply ? (
              <>
                {chat.window.state === 'human_agent' && (
                  <Text style={styles.meta}>Human reply (up to 7 days) — sent with Meta’s “human agent” tag.</Text>
                )}
                <View style={styles.inputRow}>
                  <Pressable onPress={() => void suggest()} disabled={busy !== null} style={[styles.roundBtn, styles.suggestBtn]} accessibilityLabel="Suggest a reply with AI">
                    {busy === 'suggest' ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="zap" size={18} color={colors.accent} />}
                  </Pressable>
                  <TextInput style={styles.input} value={draft} onChangeText={setDraft} placeholder="Write a reply…" placeholderTextColor={colors.textMuted}
                    multiline maxLength={1000} />
                  <Pressable onPress={() => void send()} disabled={busy !== null || !draft.trim()} style={[styles.roundBtn, styles.sendBtn, (!draft.trim() || busy) && styles.disabled]} accessibilityLabel="Send">
                    {busy === 'send' ? <ActivityIndicator size="small" color={colors.white} /> : <Feather name="send" size={18} color={colors.white} />}
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={[styles.meta, { textAlign: 'center' }]}>
                {chat.window.state === 'template' ? 'Send template (paid) — coming soon.' : w?.long}
              </Text>
            )}
          </SafeAreaView>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  iconBtn: { width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 18 },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  timer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  timerWarn: { backgroundColor: colors.warningLight },
  timerClosed: { backgroundColor: colors.mist },
  timerText: { flex: 1, fontSize: typography.size.sm, color: colors.text },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  handoff: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.errorLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  thread: { padding: spacing.lg, gap: spacing.sm },
  bubbleWrap: { alignItems: 'flex-start', gap: 2 },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleIn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: radius.sm },
  bubbleOut: { backgroundColor: colors.accent, borderBottomRightRadius: radius.sm },
  bubbleAi: { backgroundColor: colors.accentLight },
  bubbleText: { fontSize: typography.size.base, color: colors.text, lineHeight: 20 },
  stamp: { fontSize: typography.size.xs, color: colors.textMuted, paddingHorizontal: 4 },
  composer: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingBottom: spacing.sm },
  input: { flex: 1, maxHeight: 120, minHeight: 40, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.field, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 10, fontSize: typography.size.base, color: colors.text },
  roundBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  suggestBtn: { backgroundColor: colors.accentLight },
  sendBtn: { backgroundColor: colors.accent },
  disabled: { opacity: 0.4 },
}));
