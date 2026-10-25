import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ChannelIcon } from '../components/ChannelIcon';
import {
  AI_MODE_LABELS, CHANNEL_LABELS, draftInboxFaq, getInboxSettings, updateInboxSettings,
  type AiReplyMode, type FaqEntry, type InboxSettings,
} from '../lib/api';
import { hasPlaceholder } from '../lib/inbox';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InboxSettings'>;
const MODES: AiReplyMode[] = ['off', 'suggest', 'reply'];

/** AI replies per channel, and the FAQ the AI answers from. */
export function InboxSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [settings, setSettings] = useState<InboxSettings | null>(null);
  const [faq, setFaq] = useState<FaqEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'mode' | 'save' | 'draft' | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await getInboxSettings();
      setSettings(s);
      setFaq(s.faq);
      setDirty(false);
    } catch (err) {
      Alert.alert('Could not load inbox settings', err instanceof Error ? err.message : 'Please try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function setMode(channel: InboxSettings['channels'][number]['channel'], mode: AiReplyMode) {
    setBusy('mode');
    try {
      const s = await updateInboxSettings({ aiModes: { [channel]: mode } });
      setSettings((prev) => (prev ? { ...prev, channels: s.channels } : s));
    } catch (err) {
      Alert.alert('Could not change the AI', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  function edit(i: number, patch: Partial<FaqEntry>) {
    setFaq((f) => f.map((e, j) => (j === i ? { ...e, ...patch } : e)));
    setDirty(true);
  }

  async function save() {
    setBusy('save');
    try {
      const s = await updateInboxSettings({ faq });
      setSettings(s);
      setFaq(s.faq);
      setDirty(false);
    } catch (err) {
      Alert.alert('Could not save the FAQ', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  async function draft() {
    const go = async () => {
      setBusy('draft');
      try {
        const r = await draftInboxFaq();
        setFaq(r.faq);
        setDirty(true);
      } catch (err) {
        Alert.alert('Could not draft an FAQ', err instanceof Error ? err.message : 'Please try again.');
      } finally { setBusy(null); }
    };
    if (faq.length === 0) return go();
    Alert.alert('Replace your FAQ?', 'The AI will write a fresh draft from your services, prices and hours. Nothing is saved until you tap Save.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Draft', onPress: () => void go() },
    ]);
  }

  const placeholders = faq.filter((f) => hasPlaceholder(f.answer)).length;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>AI replies</Text>
        <Text style={styles.subtitle}>The AI only answers from your services, prices, hours and the FAQ below — and only within 24 hours of a customer’s message.</Text>
      </SafeAreaView>

      {!settings ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!settings.aiAvailable && <View style={styles.note}><Text style={styles.meta}>AI replies aren’t switched on in Scalio yet. You can still set up your FAQ.</Text></View>}

          <Text style={styles.section}>Per channel</Text>
          <View style={styles.card}>
            {settings.channels.map((c, i) => {
              const disabled = !c.connected || c.comingSoon || !settings.aiAvailable;
              return (
                <View key={c.channel} style={[styles.row, i > 0 && styles.divider]}>
                  <View style={styles.titleRow}>
                    <ChannelIcon channel={c.channel} size={16} />
                    <Text style={styles.name}>{CHANNEL_LABELS[c.channel]}</Text>
                    {c.comingSoon ? <Text style={styles.tag}>Coming soon</Text> : !c.connected ? <Text style={styles.tag}>Not connected</Text> : <Text style={styles.meta}>{c.accountName}</Text>}
                  </View>
                  <View style={[styles.segment, disabled && styles.disabled]}>
                    {MODES.map((m) => (
                      <Pressable key={m} onPress={() => void setMode(c.channel, m)} disabled={disabled || busy !== null}
                        style={[styles.segItem, c.mode === m && styles.segOn]} accessibilityState={{ selected: c.mode === m }}>
                        <Text style={[styles.segText, c.mode === m && styles.segTextOn]}>{AI_MODE_LABELS[m]}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.meta}>
            “Reply for me” sends answers straight away. “Suggest, I send” puts a draft in the chat for you to edit. Complaints, refunds and questions the AI can’t answer always come to you.
          </Text>

          <View style={styles.faqHeader}>
            <Text style={styles.section}>Your FAQ</Text>
            <Pressable onPress={() => void draft()} disabled={busy !== null || !settings.aiAvailable} style={[styles.chipBtn, (!settings.aiAvailable) && styles.disabled]}>
              {busy === 'draft' ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="zap" size={14} color={colors.accent} />}
              <Text style={styles.link}>Draft with AI</Text>
            </Pressable>
          </View>
          {placeholders > 0 && (
            <View style={[styles.note, { backgroundColor: colors.warningLight }]}>
              <Text style={styles.meta}>Fill in the {placeholders === 1 ? 'answer' : `${placeholders} answers`} in [brackets]. The AI won’t use an answer until it’s filled in.</Text>
            </View>
          )}
          {faq.map((f, i) => (
            <View key={i} style={styles.faqCard}>
              <View style={styles.titleRow}>
                <TextInput style={[styles.input, { flex: 1 }]} value={f.question} onChangeText={(t) => edit(i, { question: t })} placeholder="Question, e.g. Do you do home service?" placeholderTextColor={colors.textMuted} maxLength={300} />
                <Pressable onPress={() => { setFaq((x) => x.filter((_, j) => j !== i)); setDirty(true); }} hitSlop={8} accessibilityLabel="Remove question">
                  <Feather name="trash-2" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <TextInput style={[styles.input, styles.multiline, hasPlaceholder(f.answer) && { borderColor: colors.warning }]} value={f.answer} onChangeText={(t) => edit(i, { answer: t })}
                placeholder="Answer" placeholderTextColor={colors.textMuted} multiline maxLength={1000} />
            </View>
          ))}
          <Pressable onPress={() => { setFaq((x) => [...x, { question: '', answer: '' }]); setDirty(true); }} disabled={faq.length >= 40} style={styles.addBtn}>
            <Feather name="plus" size={16} color={colors.accent} />
            <Text style={styles.link}>Add a question</Text>
          </Pressable>

          <Pressable onPress={() => void save()} disabled={!dirty || busy !== null} style={[styles.saveBtn, (!dirty || busy !== null) && styles.disabled]}>
            {busy === 'save' ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save FAQ</Text>}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: spacing.xs },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  section: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: spacing.lg },
  row: { paddingVertical: spacing.md, gap: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  tag: { fontSize: typography.size.xs, color: colors.textMuted, backgroundColor: colors.mist, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  segment: { flexDirection: 'row', backgroundColor: colors.mist, borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.sm },
  segOn: { backgroundColor: colors.background },
  segText: { fontSize: typography.size.xs, color: colors.textSecondary, fontWeight: typography.weight.medium },
  segTextOn: { color: colors.accent, fontWeight: typography.weight.bold },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  chipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentLight, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  faqCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.field, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: typography.size.base, color: colors.text },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.md },
  saveText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  disabled: { opacity: 0.5 },
  note: { backgroundColor: colors.mist, borderRadius: radius.md, padding: spacing.md },
}));
