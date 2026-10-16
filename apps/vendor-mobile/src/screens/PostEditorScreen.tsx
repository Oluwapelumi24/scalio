import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  createPost, deletePost, getPost, getStudio, markPosted, mediaSource, planPost, unplanPost, updatePost, uploadMedia, writeCaption,
  type ContentPlatform, type ContentPost, type PostFields, type StudioInfo,
} from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostEditor'>;

const MAX_PHOTO_BASE64 = 5_000_000; // matches the backend limit (~3.5 MB photo)
const TIMES = [{ h: 9, label: '9am' }, { h: 12, label: '12pm' }, { h: 18, label: '6pm' }, { h: 20, label: '8pm' }];

const parseTags = (text: string) => text.split(/[\s,]+/).map((t) => t.replace(/^#+/, '')).filter(Boolean);
const tagsText = (tags: string[]) => tags.map((t) => `#${t}`).join(' ');

function nextDays(n: number) {
  const out: { date: Date; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({ date: d, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) });
  }
  return out;
}

export function PostEditorScreen({ navigation, route }: Props) {
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [post, setPost] = useState<ContentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<null | 'photo' | 'ai' | 'save' | 'plan' | 'posted'>(null);

  const [mediaId, setMediaId] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('friendly');
  const [platforms, setPlatforms] = useState<ContentPlatform[]>(['instagram']);
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('');
  const [tags, setTags] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);

  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState(18);
  const [postedOn, setPostedOn] = useState<ContentPlatform[]>([]);

  const fill = (p: ContentPost) => {
    setPost(p);
    setMediaId(p.mediaId);
    setBrief(p.brief ?? '');
    if (p.tone) setTone(p.tone);
    setPlatforms(p.platforms);
    setCaption(p.caption);
    setCta(p.callToAction ?? '');
    setTags(tagsText(p.hashtags));
    setAiGenerated(p.aiGenerated);
    setPostedOn(p.status === 'posted' ? p.postedPlatforms : p.platforms);
    setDirty(false);
  };

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([getStudio(), route.params.postId ? getPost(route.params.postId) : Promise.resolve(null)]);
      setStudio(s);
      if (p) fill(p);
    } catch (err) {
      Alert.alert('Could not open the post', err instanceof Error ? err.message : 'Please try again.');
      navigation.goBack();
    } finally { setLoading(false); }
  }, [route.params.postId, navigation]);
  useEffect(() => { void load(); }, [load]);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true); };

  const fields = (): PostFields => ({
    mediaId, brief: brief.trim() || null, tone, caption, callToAction: cta.trim() || null,
    hashtags: parseTags(tags), platforms, aiGenerated,
  });

  /** Saves pending edits and returns the post as the server now has it. */
  async function ensureSaved(): Promise<ContentPost> {
    if (post && !dirty) return post;
    const saved = post ? await updatePost(post.id, fields()) : await createPost(fields());
    fill(saved);
    return saved;
  }

  async function run(kind: NonNullable<typeof busy>, title: string, fn: () => Promise<void>) {
    setBusy(kind);
    try { await fn(); } catch (err) {
      Alert.alert(title, err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  const pickPhoto = () => run('photo', 'Could not add the photo', async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) throw new Error('That photo could not be read. Try another one.');
    if (asset.base64.length > MAX_PHOTO_BASE64) throw new Error('That photo is too large. Choose one under 3.5 MB.');
    const media = await uploadMedia(asset.mimeType ?? 'image/jpeg', asset.base64);
    setMediaId(media.id); setLocalUri(asset.uri); setDirty(true);
  });

  const aiBlocked = !studio ? 'Loading…'
    : !studio.ai.available ? "AI captions aren't switched on yet."
    : studio.ai.usedToday >= studio.ai.dailyLimit ? `You've used today's ${studio.ai.dailyLimit} AI captions.`
    : brief.trim().length < 3 ? 'Say what the post is about first.'
    : platforms.length === 0 ? 'Choose at least one platform.'
    : null;

  const generate = () => {
    const go = () => run('ai', 'Could not write a caption', async () => {
      const draft = await writeCaption({ brief: brief.trim(), tone, platforms, mediaId: mediaId ?? undefined });
      setCaption(draft.caption); setCta(draft.callToAction); setTags(tagsText(draft.hashtags));
      setAiGenerated(true); setDirty(true);
      setStudio((s) => (s ? { ...s, ai: { ...s.ai, usedToday: s.ai.usedToday + 1 } } : s));
    });
    if (caption.trim()) {
      Alert.alert('Replace your caption?', 'AI will write a new caption, call to action and hashtags.', [
        { text: 'Cancel', style: 'cancel' }, { text: 'Replace', onPress: go },
      ]);
    } else go();
  };

  const save = () => run('save', 'Could not save', async () => { await ensureSaved(); });

  const copy = (platform: ContentPlatform, name: string) => run('save', 'Could not copy', async () => {
    // Copy what the server has after saving, so unsaved edits are never left out.
    const check = (await ensureSaved()).checks.find((c) => c.platform === platform);
    if (!check) throw new Error(`${name} isn't one of this post's platforms any more.`);
    if (check.problems.length) throw new Error(check.problems.join('\n'));
    await Clipboard.setStringAsync(check.text);
    Alert.alert('Caption copied', `Open ${name}, add your photo and paste the caption. Then come back and mark it as posted.`);
  });

  const plan = () => run('plan', 'Could not plan the post', async () => {
    const saved = await ensureSaved();
    const d = nextDays(7)[dayIndex].date;
    const when = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour);
    if (when.getTime() < Date.now()) throw new Error('That time has passed. Pick a later time.');
    fill(await planPost(saved.id, when.toISOString()));
  });

  const unplan = () => run('plan', 'Could not update the post', async () => { fill(await unplanPost(post!.id)); });

  const posted = () => run('posted', 'Could not mark as posted', async () => {
    if (postedOn.length === 0) throw new Error('Choose where you posted it.');
    const saved = await ensureSaved();
    fill(await markPosted(saved.id, postedOn));
  });

  const remove = () => Alert.alert('Delete this post?', 'The caption and photo will be removed from Scalio.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => run('save', 'Could not delete', async () => { await deletePost(post!.id); navigation.goBack(); }) },
  ]);

  if (loading || !studio) return <View style={[styles.root, { justifyContent: 'center' }]}><ActivityIndicator color={colors.accent} /></View>;

  const specs = new Map(studio.platforms.map((p) => [p.id, p]));
  const toggle = (list: ContentPlatform[], id: ContentPlatform) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const photo = localUri ? { uri: localUri } : mediaId ? mediaSource(mediaId) : null;
  const isPosted = post?.status === 'posted';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{post ? (isPosted ? 'Posted' : post.status === 'planned' ? 'Planned post' : 'Draft') : 'New post'}</Text>
          {post ? (
            <Pressable onPress={remove} hitSlop={8} accessibilityLabel="Delete post"><Feather name="trash-2" size={18} color={colors.error} /></Pressable>
          ) : <View style={{ width: 18 }} />}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 1. Photo */}
        <Pressable style={styles.photoBox} onPress={pickPhoto} disabled={busy !== null} accessibilityRole="button" accessibilityLabel={photo ? 'Change photo' : 'Add a photo'}>
          {busy === 'photo' ? <ActivityIndicator color={colors.accent} />
            : photo ? <Image source={photo} style={styles.photo} resizeMode="cover" />
            : (<><Feather name="image" size={28} color={colors.textMuted} /><Text style={styles.meta}>Add a photo</Text></>)}
        </Pressable>
        {photo && (
          <Pressable onPress={() => { setMediaId(null); setLocalUri(null); setDirty(true); }} style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.link}>Remove photo</Text>
          </Pressable>
        )}

        {/* 2. What it's about → AI */}
        <Text style={styles.label}>What's this post about?</Text>
        <TextInput style={[styles.input, styles.multiline]} value={brief} onChangeText={edit(setBrief)} multiline maxLength={1000}
          placeholder="e.g. New knotless braids style, 20% off this week only" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Tone</Text>
        <View style={styles.wrap}>
          {studio.tones.map((t) => (
            <Pressable key={t.id} onPress={() => edit(setTone)(t.id)} style={[styles.chip, tone === t.id && styles.chipOn]} accessibilityState={{ selected: tone === t.id }}>
              <Text style={[styles.chipText, tone === t.id && styles.chipTextOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Where will you post it?</Text>
        <View style={styles.wrap}>
          {studio.platforms.map((p) => (
            <Pressable key={p.id} onPress={() => edit(setPlatforms)(toggle(platforms, p.id))} style={[styles.chip, platforms.includes(p.id) && styles.chipOn]} accessibilityState={{ selected: platforms.includes(p.id) }}>
              <Text style={[styles.chipText, platforms.includes(p.id) && styles.chipTextOn]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.ai, (aiBlocked || busy) && styles.disabled]} onPress={generate} disabled={!!aiBlocked || busy !== null} accessibilityRole="button">
          {busy === 'ai' ? <ActivityIndicator color={colors.white} /> : <Feather name="zap" size={16} color={colors.white} />}
          <Text style={styles.aiText}>{busy === 'ai' ? 'Writing…' : caption.trim() ? 'Write again with AI' : 'Write with AI'}</Text>
        </Pressable>
        <Text style={styles.meta}>
          {aiBlocked ?? `AI writes a draft from your description and photo. Check it before posting — it only uses facts you give it. ${studio.ai.dailyLimit - studio.ai.usedToday} left today.`}
        </Text>

        {/* 3. The post itself */}
        <Text style={styles.label}>Caption</Text>
        <TextInput style={[styles.input, styles.caption]} value={caption} onChangeText={edit(setCaption)} multiline placeholder="Write your caption" placeholderTextColor={colors.textMuted} />
        <Text style={styles.label}>Call to action</Text>
        <TextInput style={styles.input} value={cta} onChangeText={edit(setCta)} maxLength={300} placeholder="e.g. Book through the link in our bio" placeholderTextColor={colors.textMuted} />
        <Text style={styles.label}>Hashtags</Text>
        <TextInput style={styles.input} value={tags} onChangeText={edit(setTags)} autoCapitalize="none" placeholder="#LagosBraids #knotless" placeholderTextColor={colors.textMuted} />
        {aiGenerated && <Text style={styles.meta}>Written with AI, edited by you.</Text>}

        <Pressable style={[styles.secondary, (!dirty || busy) && styles.disabled]} onPress={save} disabled={!dirty || busy !== null} accessibilityRole="button">
          <Text style={styles.secondaryText}>{busy === 'save' ? 'Saving…' : dirty ? (post ? 'Save changes' : 'Save draft') : 'Saved'}</Text>
        </Pressable>

        {/* 4. Preview and copy per platform */}
        {post && (
          <>
            <Text style={styles.section}>Preview</Text>
            {dirty && <Text style={styles.meta}>Save to update the preview.</Text>}
            {post.checks.length === 0 && <Text style={styles.meta}>Choose a platform to see how the post will look.</Text>}
            {post.checks.map((c) => {
              const spec = specs.get(c.platform)!;
              return (
                <View key={c.platform} style={styles.card}>
                  <Text style={styles.cardTitle}>{spec.name}</Text>
                  <Text style={styles.preview}>{c.text || ' '}</Text>
                  {c.problems.map((p) => <Text key={p} style={styles.problem}>• {p}</Text>)}
                  {c.notes.map((n) => <Text key={n} style={styles.meta}>{n}</Text>)}
                  <Text style={styles.meta}>{spec.manualReason}</Text>
                  <Pressable style={[styles.copy, (c.problems.length > 0 || busy) && styles.disabled]} disabled={c.problems.length > 0 || busy !== null}
                    onPress={() => copy(c.platform, spec.name)} accessibilityRole="button" accessibilityHint={c.problems.length ? 'Fix the problems above first' : undefined}>
                    <Feather name="copy" size={14} color={colors.accent} />
                    <Text style={styles.copyText}>Copy for {spec.name}</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}

        {/* 5. Plan it */}
        {!isPosted && (
          <>
            <Text style={styles.section}>Plan it</Text>
            {post?.status === 'planned' && post.plannedFor ? (
              <View style={styles.card}>
                <Text style={styles.lineLabel}>
                  On your calendar for {new Date(post.plannedFor).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
                </Text>
                <Text style={styles.meta}>It shows on your home screen on the day. Pick a new time below to move it.</Text>
                <Pressable onPress={unplan} disabled={busy !== null}><Text style={styles.link}>Take off the calendar</Text></Pressable>
              </View>
            ) : null}
            <View style={styles.wrap}>
              {nextDays(7).map((d, i) => (
                <Pressable key={d.label} onPress={() => setDayIndex(i)} style={[styles.chip, dayIndex === i && styles.chipOn]}>
                  <Text style={[styles.chipText, dayIndex === i && styles.chipTextOn]}>{d.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.wrap}>
              {TIMES.map((t) => (
                <Pressable key={t.h} onPress={() => setHour(t.h)} style={[styles.chip, hour === t.h && styles.chipOn]}>
                  <Text style={[styles.chipText, hour === t.h && styles.chipTextOn]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.secondary, (!caption.trim() || busy) && styles.disabled]} onPress={plan} disabled={!caption.trim() || busy !== null} accessibilityRole="button">
              <Text style={styles.secondaryText}>{busy === 'plan' ? 'Planning…' : post?.status === 'planned' ? 'Move to this time' : 'Add to calendar'}</Text>
            </Pressable>
            {!caption.trim() && <Text style={styles.meta}>Add a caption before planning.</Text>}
          </>
        )}

        {/* 6. Posted */}
        <Text style={styles.section}>{isPosted ? 'Posted on' : 'Already posted it?'}</Text>
        <View style={styles.wrap}>
          {studio.platforms.map((p) => (
            <Pressable key={p.id} onPress={() => setPostedOn(toggle(postedOn, p.id))} style={[styles.chip, postedOn.includes(p.id) && styles.chipOn]}>
              <Text style={[styles.chipText, postedOn.includes(p.id) && styles.chipTextOn]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={[styles.primary, (!caption.trim() || postedOn.length === 0 || busy) && styles.disabled]} onPress={posted}
          disabled={!caption.trim() || postedOn.length === 0 || busy !== null} accessibilityRole="button">
          <Text style={styles.primaryText}>{busy === 'posted' ? 'Saving…' : isPosted ? 'Update where it was posted' : 'Mark as posted'}</Text>
        </Pressable>
        {isPosted && post?.postedAt && (
          <Text style={styles.meta}>Marked as posted on {new Date(post.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  back: { width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  photoBox: { height: 220, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  caption: { minHeight: 140, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  ai: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.sm },
  aiText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  disabled: { opacity: 0.45 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  link: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  section: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.lg },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  preview: { fontSize: typography.size.base, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  problem: { fontSize: typography.size.sm, color: colors.error },
  lineLabel: { fontSize: typography.size.base, color: colors.text, fontWeight: typography.weight.medium },
  copy: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  copyText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  secondary: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.md },
});
