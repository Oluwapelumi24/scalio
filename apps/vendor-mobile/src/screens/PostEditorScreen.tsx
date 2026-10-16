import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  cancelPublication, createPost, deletePost, getPost, getStudio, markPosted, mediaSource, planPost, publishPost, retryPublication,
  unplanPost, updatePost, uploadMedia, writeCaption,
  type ContentPlatform, type ContentPost, type PostFields, type Publication, type StudioInfo,
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
  const [brief, setBrief] = useState(route.params.brief ?? '');
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

  const usePhoto = (source: 'camera' | 'library') => run('photo', 'Could not add the photo', async () => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('Allow camera access for Scalio in your phone’s Settings to take photos.');
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) throw new Error('That photo could not be read. Try another one.');
    if (asset.base64.length > MAX_PHOTO_BASE64) throw new Error('That photo is too large. Choose one under 3.5 MB.');
    // The picker hands back JPEG data (what Instagram needs); the server checks the bytes anyway.
    const media = await uploadMedia('image/jpeg', asset.base64);
    setMediaId(media.id); setLocalUri(asset.uri); setDirty(true);
  });

  const pickPhoto = () => Alert.alert(mediaId ? 'Change photo' : 'Add a photo', undefined, [
    { text: 'Take photo', onPress: () => usePhoto('camera') },
    { text: 'Choose from library', onPress: () => usePhoto('library') },
    { text: 'Cancel', style: 'cancel' },
  ]);

  const aiBlocked = !studio ? 'Loading…'
    : !studio.ai.available ? "AI captions aren't switched on yet."
    : studio.ai.usedToday >= studio.ai.dailyLimit ? `You've used today's ${studio.ai.dailyLimit} AI captions.`
    : !mediaId && brief.trim().length < 3 ? 'Add a photo, or say what the post is about.'
    : platforms.length === 0 ? 'Choose at least one platform.'
    : null;

  const generate = () => {
    const go = () => run('ai', 'Could not write a caption', async () => {
      const draft = await writeCaption({ brief: brief.trim() || undefined, tone, platforms, mediaId: mediaId ?? undefined });
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

  /** Platforms this post goes to that Scalio can publish to itself. */
  const autoTargets = (studio?.platforms ?? [])
    .filter((p) => p.publishing === 'automatic' && platforms.includes(p.id))
    .map((p) => p.id as 'facebook' | 'instagram');

  const publish = (when: 'now' | 'scheduled') => run('posted', 'Could not publish', async () => {
    const saved = await ensureSaved();
    let at: string | undefined;
    if (when === 'scheduled') {
      const d = nextDays(7)[dayIndex].date;
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour);
      if (t.getTime() < Date.now()) throw new Error('That time has passed. Pick a later time.');
      at = t.toISOString();
    }
    await publishPost(saved.id, autoTargets, at);
    fill(await getPost(saved.id));
    if (when === 'now') setTimeout(() => { getPost(saved.id).then(fill).catch(() => {}); }, 8000);
  });

  const retry = (pub: Publication) => run('posted', 'Could not try again', async () => { await retryPublication(pub.id); fill(await getPost(post!.id)); });
  const cancelPub = (pub: Publication) => run('posted', 'Could not cancel', async () => { await cancelPublication(pub.id); fill(await getPost(post!.id)); });

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
        <Text style={styles.label}>Anything to add? (optional)</Text>
        <TextInput style={[styles.input, styles.multiline]} value={brief} onChangeText={edit(setBrief)} multiline maxLength={1000}
          placeholder="AI writes from your photo. Add a price, offer or style name if you like, e.g. 20% off this week" placeholderTextColor={colors.textMuted} />

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
          {aiBlocked ?? `AI writes a draft from your photo and notes. Check it before posting — it won’t make up prices or offers. ${studio.ai.dailyLimit - studio.ai.usedToday} left today.`}
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

        {/* 5. Publish from Scalio (connected platforms) */}
        {!isPosted && (
          <>
            <Text style={styles.section}>Publish</Text>
            {autoTargets.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.lineLabel}>Scalio can post this to {autoTargets.map((p) => specs.get(p)!.name).join(' and ')} for you.</Text>
                <Pressable style={[styles.primary, (!caption.trim() || busy) && styles.disabled]} onPress={() => publish('now')} disabled={!caption.trim() || busy !== null} accessibilityRole="button">
                  <Text style={styles.primaryText}>{busy === 'posted' ? 'Sending…' : 'Publish now'}</Text>
                </Pressable>
                <Text style={styles.meta}>Or pick a day and time under “Plan it” and tap “Schedule”.</Text>
              </View>
            ) : studio.platforms.some((p) => p.canConnect) ? (
              <Pressable onPress={() => navigation.navigate('SocialAccounts')} style={styles.card} accessibilityRole="button">
                <Text style={styles.lineLabel}>Connect Facebook and Instagram to publish and schedule straight from Scalio.</Text>
                <Text style={styles.link}>Connect accounts</Text>
              </Pressable>
            ) : (
              <Text style={styles.meta}>Publishing from Scalio isn’t available yet. Copy the caption from the preview above and post from each app.</Text>
            )}
          </>
        )}
        {post && post.publications.length > 0 && (
          <View style={styles.card}>
            {post.publications.map((pub) => (
              <View key={pub.id} style={{ gap: 4 }}>
                <Text style={styles.lineLabel}>
                  {specs.get(pub.platform)?.name}: {pub.status === 'queued' ? (new Date(pub.runAt) > new Date() ? `scheduled for ${new Date(pub.runAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'sending…')
                    : pub.status === 'publishing' ? 'sending…' : pub.status === 'published' ? 'published' : pub.status === 'failed' ? 'didn’t go out' : 'cancelled'}
                </Text>
                {pub.status === 'failed' && pub.error && <Text style={styles.problem}>{pub.error}</Text>}
                <View style={styles.wrap}>
                  {pub.status === 'published' && pub.permalink && <Pressable onPress={() => Linking.openURL(pub.permalink!)}><Text style={styles.link}>View post</Text></Pressable>}
                  {(pub.status === 'failed' || pub.status === 'cancelled') && <Pressable onPress={() => retry(pub)} disabled={busy !== null}><Text style={styles.link}>Try again</Text></Pressable>}
                  {pub.status === 'queued' && <Pressable onPress={() => cancelPub(pub)} disabled={busy !== null}><Text style={styles.link}>Cancel</Text></Pressable>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 6. Plan it */}
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
            {autoTargets.length > 0 && (
              <Pressable style={[styles.primary, (!caption.trim() || busy) && styles.disabled]} onPress={() => publish('scheduled')} disabled={!caption.trim() || busy !== null} accessibilityRole="button">
                <Text style={styles.primaryText}>Schedule for {autoTargets.map((p) => specs.get(p)!.name).join(' & ')}</Text>
              </Pressable>
            )}
            <Text style={styles.meta}>
              {!caption.trim() ? 'Add a caption before planning.'
                : autoTargets.length > 0 ? '“Schedule” posts automatically at that time. “Add to calendar” only reminds you on the day.'
                : 'It shows on your home screen on the day, as a reminder to post.'}
            </Text>
          </>
        )}

        {/* 7. Posted by hand */}
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
