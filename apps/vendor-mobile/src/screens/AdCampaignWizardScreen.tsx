import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { StepProgress } from '../components/StepProgress';
import {
  checkoutAdCampaign, createAdCampaign, draftAdCopy, estimateAdReach, getAdBuilder, quoteAd, searchAdInterests, searchAdLocations, suggestAdInterests, uploadMedia,
  type AdBuilder, type AdCopyDraft, type AdDestination, type AdExtras, type AdObjective, type AdPaymentRoute, type AdQuote, type AdTargeting,
  type InterestOption, type LocationOption,
} from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AdCampaignWizard'>;
type StepKey = 'goal' | 'audience' | 'placements' | 'ad' | 'budget' | 'review';

const STEP_LABELS: Record<StepKey, string> = { goal: 'Goal', audience: 'Audience', placements: 'Placements', ad: 'Your ad', budget: 'Budget', review: 'Review' };
const DEST_LABELS: Record<AdDestination, string> = { whatsapp: 'WhatsApp', instagram_direct: 'Instagram DM', messenger: 'Messenger', website: 'Website', app: 'App store' };
const DEST_ICONS: Record<AdDestination, React.ComponentProps<typeof Feather>['name']> = {
  whatsapp: 'message-circle', instagram_direct: 'instagram', messenger: 'message-square', website: 'globe', app: 'smartphone',
};
const OBJECTIVE_ICONS: Record<AdObjective, React.ComponentProps<typeof Feather>['name']> = {
  engagement: 'message-circle', awareness: 'eye', traffic: 'mouse-pointer', leads: 'user-plus', app_promotion: 'download', sales: 'shopping-bag',
};
const PLACEMENTS = [
  { platform: 'facebook', id: 'feed', label: 'Facebook Feed' },
  { platform: 'facebook', id: 'story', label: 'Facebook Stories' },
  { platform: 'facebook', id: 'facebook_reels', label: 'Facebook Reels' },
  { platform: 'instagram', id: 'stream', label: 'Instagram Feed' },
  { platform: 'instagram', id: 'story', label: 'Instagram Stories' },
  { platform: 'instagram', id: 'reels', label: 'Instagram Reels' },
  { platform: 'messenger', id: 'messenger_home', label: 'Messenger inbox' },
] as const;
const BUDGET_PRESETS = [200_000, 500_000, 1_000_000, 2_000_000];
const RUN_OPTIONS = [7, 14, 30];
const DAY_MS = 86_400_000;
const MAX_PHOTO_BASE64 = 5_000_000;
const CHAT: AdDestination[] = ['whatsapp', 'instagram_direct', 'messenger'];

const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
const endDateLabel = (start: Date, days: number) => new Date(start.getTime() + days * DAY_MS).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Debounced async value: re-runs `fn` 400 ms after its inputs settle. */
function useDebounced<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      fn().then((v) => { if (live) setValue(v); }).catch(() => undefined).finally(() => { if (live) setLoading(false); });
    }, 400);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { value, loading };
}

/** "Create an ad": simple mode by default (Engagement, chat ads), advanced for every Meta option. */
export function AdCampaignWizardScreen({ navigation }: Props) {
  const s = useSStyles();
  const { colors } = useTheme();
  const [builder, setBuilder] = useState<AdBuilder | null>(null);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [objective, setObjective] = useState<AdObjective>('engagement');
  const [destination, setDestination] = useState<AdDestination>('whatsapp');
  const [extras, setExtras] = useState<AdExtras>({});
  const [targeting, setTargeting] = useState<AdTargeting | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [welcome, setWelcome] = useState('');
  const [iceBreakers, setIceBreakers] = useState<string[]>(['', '', '']);
  const [brief, setBrief] = useState('');
  const [copy, setCopy] = useState<AdCopyDraft | null>(null);
  const [pickedVariant, setPickedVariant] = useState<number | null>(null);
  const [dailyBudgetKobo, setDailyBudgetKobo] = useState(500_000);
  const [days, setDays] = useState(7);
  const [route, setRoute] = useState<AdPaymentRoute>('scalio');

  useEffect(() => {
    getAdBuilder().then((b) => {
      setBuilder(b);
      setName(b.name);
      setObjective(b.objective);
      setDestination(b.destination);
      setTargeting(b.targeting);
      setDailyBudgetKobo(b.dailyBudgetKobo);
      setDays(b.days);
      setLink(b.bookingLink);
      setRoute(b.routes.scalio.available || !b.routes.own_meta.available ? 'scalio' : 'own_meta');
    }).catch((err: unknown) => {
      Alert.alert('Could not start a new ad', err instanceof Error ? err.message : 'Please try again.');
      navigation.goBack();
    });
  }, [navigation]);

  const steps: StepKey[] = mode === 'simple' ? ['goal', 'audience', 'ad', 'budget', 'review'] : ['goal', 'audience', 'placements', 'ad', 'budget', 'review'];
  const key = steps[Math.min(step, steps.length - 1)];
  const isChat = CHAT.includes(destination);
  const objectiveInfo = builder?.objectives.find((o) => o.id === objective);

  // Slide-and-fade between steps.
  const enter = useRef(new Animated.Value(1)).current;
  const go = useCallback((next: number) => {
    enter.setValue(0);
    setStep(next);
    Animated.timing(enter, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);

  const startAt = useMemo(() => new Date(), []);
  const quote = useDebounced<AdQuote>(() => quoteAd({ dailyBudgetKobo, days, route }), [dailyBudgetKobo, days, route], !!builder);
  const reach = useDebounced(
    () => estimateAdReach({ objective, destination, targeting: targeting! }),
    [JSON.stringify(targeting), objective, destination],
    !!targeting && targeting.locations.length > 0,
  );

  function switchMode(next: 'simple' | 'advanced') {
    setMode(next);
    if (next === 'simple') {
      setObjective('engagement');
      if (!CHAT.includes(destination)) setDestination('whatsapp');
      setTargeting((t) => (t ? { ...t, placements: 'automatic' } : t));
    }
  }

  function chooseObjective(o: AdObjective) {
    setObjective(o);
    const dests = builder?.objectives.find((x) => x.id === o)?.destinations ?? [];
    if (!dests.includes(destination)) setDestination(dests[0]);
  }

  async function pickPhoto(source: 'camera' | 'library') {
    setBusy('photo');
    try {
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.8 };
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
      const media = await uploadMedia('image/jpeg', asset.base64);
      setMediaId(media.id);
      setPhotoUri(asset.uri);
    } catch (err) {
      Alert.alert('Could not add the photo', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  async function writeForMe() {
    setBusy('copy');
    try {
      const draft = await draftAdCopy({ objective, destination, brief: brief.trim() || null });
      setCopy(draft);
      applyVariant(draft, 0);
      if (draft.welcomeMessage) setWelcome(draft.welcomeMessage);
      if (draft.iceBreakers.length) setIceBreakers([...draft.iceBreakers, '', '', ''].slice(0, 3));
    } catch (err) {
      Alert.alert('The AI couldn’t write your ad', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  function applyVariant(d: AdCopyDraft, i: number) {
    const v = d.variants[i];
    if (!v) return;
    setPickedVariant(i);
    setPrimaryText(v.primaryText);
    setHeadline(v.headline);
    setDescription(v.description);
  }

  async function pay() {
    if (!builder || !targeting || !mediaId) return;
    setBusy('pay');
    try {
      const campaign = await createAdCampaign({
        name: name.trim() || builder.name, mode, objective, destination, route, dailyBudgetKobo,
        startAt: startAt.toISOString(), endAt: new Date(startAt.getTime() + days * DAY_MS).toISOString(),
        targeting,
        creative: {
          mediaId, primaryText: primaryText.trim(), headline: headline.trim(), description: description.trim() || null,
          link: destination === 'website' ? link.trim() : null,
          welcomeMessage: isChat ? welcome.trim() || null : null,
          iceBreakers: isChat ? iceBreakers.map((q) => q.trim()).filter(Boolean) : [],
        },
        extras,
      });
      const checkout = await checkoutAdCampaign(campaign.id);
      navigation.replace('AdCampaign', { id: campaign.id });
      if (!checkout.paid && checkout.authorizationUrl) await Linking.openURL(checkout.authorizationUrl);
    } catch (err) {
      Alert.alert('Could not set up your ad', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(null); }
  }

  if (!builder || !targeting) return <View style={[s.root, s.center]}><ActivityIndicator color={colors.accent} /></View>;

  // What blocks "Continue" on each step, in plain words (null = good to go).
  const blocker: string | null = (() => {
    switch (key) {
      case 'goal':
        if (destination === 'website' && !/^https:\/\//.test(link)) return 'Add the https:// link people should visit.';
        if (destination === 'app' && (!extras.appId || !/^https:\/\//.test(extras.appStoreUrl ?? ''))) return 'Add your app id and store link.';
        if (objective === 'sales' && destination === 'website' && !extras.pixelId) return 'Add your Meta pixel id.';
        return null;
      case 'audience': return targeting.locations.length === 0 ? 'Choose at least one place.' : null;
      case 'placements': return targeting.placements !== 'automatic' && Object.values(targeting.placements).every((p) => p.length === 0) ? 'Pick at least one placement.' : null;
      case 'ad':
        if (!mediaId) return 'Add a photo for your ad.';
        if (!primaryText.trim() || !headline.trim()) return 'Add your ad text and headline — or tap “Write it for me”.';
        return null;
      case 'budget': return !builder.routes[route].available ? builder.routes[route].reason : null;
      default: return null;
    }
  })();

  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['top']} style={s.header}>
        <View style={s.headerRow}>
          <Pressable onPress={() => (step > 0 ? go(step - 1) : navigation.goBack())} hitSlop={8} accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={s.title}>Create an ad</Text>
          <Pressable onPress={() => switchMode(mode === 'simple' ? 'advanced' : 'simple')} hitSlop={8} style={s.modeToggle} accessibilityRole="switch" accessibilityState={{ checked: mode === 'advanced' }}>
            <Feather name={mode === 'simple' ? 'sliders' : 'zap'} size={13} color={colors.accent} />
            <Text style={s.modeText}>{mode === 'simple' ? 'Advanced' : 'Simple'}</Text>
          </Pressable>
        </View>
        <StepProgress steps={steps.map((k) => STEP_LABELS[k])} current={step} onStepPress={go} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: enter, transform: [{ translateX }], gap: spacing.md }}>
          {key === 'goal' && (
            <>
              <Text style={s.h2}>What do you want from this ad?</Text>
              {(mode === 'simple' ? builder.objectives.filter((o) => o.simple) : builder.objectives).map((o) => (
                <Pressable key={o.id} onPress={() => chooseObjective(o.id)} style={[s.option, objective === o.id && s.optionOn]} accessibilityRole="radio" accessibilityState={{ selected: objective === o.id }}>
                  <View style={[s.optionIcon, objective === o.id && s.optionIconOn]}><Feather name={OBJECTIVE_ICONS[o.id]} size={18} color={objective === o.id ? colors.white : colors.accent} /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={s.rowGap}>
                      <Text style={s.optionTitle}>{o.label}</Text>
                      {o.id === 'engagement' && <Text style={s.badge}>Recommended</Text>}
                    </View>
                    <Text style={s.muted}>{o.blurb}</Text>
                    {mode === 'advanced' && <Text style={s.hint}>Best for: {o.bestFor}</Text>}
                  </View>
                </Pressable>
              ))}

              {(objectiveInfo?.destinations.length ?? 0) > 1 && (
                <>
                  <Text style={s.label}>Where should people go?</Text>
                  <View style={s.chips}>
                    {objectiveInfo!.destinations.map((d) => (
                      <Chip key={d} icon={DEST_ICONS[d]} label={DEST_LABELS[d]} on={destination === d} onPress={() => setDestination(d)} />
                    ))}
                  </View>
                  {destination === 'whatsapp' && <Text style={s.hint}>Your WhatsApp Business number must be linked to your Facebook Page.</Text>}
                </>
              )}
              {destination === 'website' && <Field label="Link people visit" value={link} onChangeText={setLink} placeholder="https://" autoCapitalize="none" />}
              {destination === 'app' && (
                <>
                  <Field label="Meta app id" value={extras.appId ?? ''} onChangeText={(v) => setExtras({ ...extras, appId: v.replace(/\D/g, '') })} keyboardType="number-pad" />
                  <Field label="App Store or Google Play link" value={extras.appStoreUrl ?? ''} onChangeText={(v) => setExtras({ ...extras, appStoreUrl: v })} placeholder="https://" autoCapitalize="none" />
                </>
              )}
              {objective === 'sales' && destination === 'website' && (
                <Field label="Meta pixel id" value={extras.pixelId ?? ''} onChangeText={(v) => setExtras({ ...extras, pixelId: v.replace(/\D/g, '') })} keyboardType="number-pad" />
              )}
              {mode === 'simple' && (
                <Pressable onPress={() => switchMode('advanced')}><Text style={s.link}>Other goals (awareness, website visits, sales…) →</Text></Pressable>
              )}
            </>
          )}

          {key === 'audience' && (
            <AudienceStep targeting={targeting} onChange={setTargeting} advanced={mode === 'advanced'} reach={reach.value?.estimate ?? null} reachLoading={reach.loading} />
          )}

          {key === 'placements' && (
            <>
              <Text style={s.h2}>Where should your ad appear?</Text>
              <Pressable onPress={() => setTargeting({ ...targeting, placements: 'automatic' })} style={[s.option, targeting.placements === 'automatic' && s.optionOn]}>
                <View style={[s.optionIcon, targeting.placements === 'automatic' && s.optionIconOn]}><Feather name="zap" size={18} color={targeting.placements === 'automatic' ? colors.white : colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <View style={s.rowGap}><Text style={s.optionTitle}>Automatic</Text><Text style={s.badge}>Recommended</Text></View>
                  <Text style={s.muted}>Meta shows your ad where it gets the best results for your budget.</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => targeting.placements === 'automatic' && setTargeting({ ...targeting, placements: { facebook: ['feed'], instagram: ['stream', 'story'], messenger: [] } })}
                style={[s.option, targeting.placements !== 'automatic' && s.optionOn]}
              >
                <View style={[s.optionIcon, targeting.placements !== 'automatic' && s.optionIconOn]}><Feather name="list" size={18} color={targeting.placements !== 'automatic' ? colors.white : colors.accent} /></View>
                <View style={{ flex: 1 }}><Text style={s.optionTitle}>Choose myself</Text><Text style={s.muted}>Pick exactly where it shows.</Text></View>
              </Pressable>
              {targeting.placements !== 'automatic' && (
                <View style={s.card}>
                  {PLACEMENTS.map((p) => {
                    const pl = targeting.placements as Exclude<AdTargeting['placements'], 'automatic'>;
                    const on = pl[p.platform].includes(p.id);
                    return (
                      <Pressable key={`${p.platform}-${p.id}`} style={s.checkRow} onPress={() => setTargeting({
                        ...targeting, placements: { ...pl, [p.platform]: on ? pl[p.platform].filter((x) => x !== p.id) : [...pl[p.platform], p.id] },
                      })}>
                        <Feather name={on ? 'check-square' : 'square'} size={18} color={on ? colors.accent : colors.textMuted} />
                        <Text style={s.body}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {key === 'ad' && (
            <>
              <Text style={s.h2}>Your ad</Text>
              <Pressable
                style={s.photo}
                onPress={() => Alert.alert(mediaId ? 'Change photo' : 'Add a photo', undefined, [
                  { text: 'Take photo', onPress: () => void pickPhoto('camera') },
                  { text: 'Choose from library', onPress: () => void pickPhoto('library') },
                  { text: 'Cancel', style: 'cancel' },
                ])}
                accessibilityRole="button"
              >
                {busy === 'photo' ? <ActivityIndicator color={colors.accent} /> : photoUri ? <Image source={{ uri: photoUri }} style={s.photoImg} /> : (
                  <View style={s.center}><Feather name="image" size={28} color={colors.accent} /><Text style={s.link}>Add a photo of your work</Text></View>
                )}
              </Pressable>

              {builder.aiAvailable && (
                <View style={s.aiBox}>
                  <View style={s.rowGap}><Feather name="star" size={14} color={colors.accent} /><Text style={s.optionTitle}>Write it for me</Text></View>
                  <TextInput style={s.input} value={brief} onChangeText={setBrief} placeholder="Optional: what to promote (e.g. weekend braids)" placeholderTextColor={colors.textMuted} />
                  <Pressable style={[s.secondaryBtn, busy === 'copy' && s.disabled]} onPress={() => void writeForMe()} disabled={busy === 'copy'}>
                    {busy === 'copy' ? <ActivityIndicator color={colors.accent} /> : <Text style={s.secondaryText}>{copy ? 'Write 3 new versions' : 'Write 3 versions'}</Text>}
                  </Pressable>
                  {copy && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                      {copy.variants.map((v, i) => (
                        <Pressable key={i} onPress={() => applyVariant(copy, i)} style={[s.variant, pickedVariant === i && s.variantOn]}>
                          <Text style={s.variantAngle}>{v.angle}</Text>
                          <Text numberOfLines={4} style={s.muted}>{v.primaryText}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <Field label="Ad text" value={primaryText} onChangeText={setPrimaryText} multiline counter={280} />
              <Field label="Headline" value={headline} onChangeText={setHeadline} counter={40} />
              {mode === 'advanced' && <Field label="Description (optional)" value={description} onChangeText={setDescription} counter={30} />}

              {isChat && (
                <View style={s.card}>
                  <Text style={s.optionTitle}>When the chat opens</Text>
                  <Text style={s.hint}>Your first message, plus up to 3 questions people can tap.</Text>
                  <Field label="Welcome message" value={welcome} onChangeText={setWelcome} multiline counter={300} placeholder={`Hi! Thanks for reaching ${builder.pageName ?? 'us'} 👋 How can we help?`} />
                  {iceBreakers.map((q, i) => (
                    <Field key={i} label={`Quick question ${i + 1}`} value={q} onChangeText={(v) => setIceBreakers(iceBreakers.map((x, j) => (j === i ? v : x)))} placeholder={['How much is it?', 'Can I book for Saturday?', 'Where are you located?'][i]} counter={80} />
                  ))}
                </View>
              )}

              <AdPreview pageName={builder.pageName ?? 'Your business'} photoUri={photoUri} text={primaryText} headline={headline} cta={isChat ? `Send ${DEST_LABELS[destination]} message` : destination === 'app' ? 'Install now' : 'Book now'} />
            </>
          )}

          {key === 'budget' && (
            <>
              <Text style={s.h2}>Budget and schedule</Text>
              <Text style={s.label}>How much per day?</Text>
              <View style={s.chips}>
                {BUDGET_PRESETS.map((b) => <Chip key={b} label={naira(b)} on={dailyBudgetKobo === b} onPress={() => setDailyBudgetKobo(b)} />)}
              </View>
              <Stepper
                value={naira(dailyBudgetKobo)}
                onMinus={() => setDailyBudgetKobo(Math.max(200_000, dailyBudgetKobo - 50_000))}
                onPlus={() => setDailyBudgetKobo(Math.min(50_000_000, dailyBudgetKobo + 50_000))}
                caption="a day"
              />
              {reach.value?.estimate && <Text style={s.hint}>Your audience: about {compact(reach.value.estimate.lower)}–{compact(reach.value.estimate.upper)} people.</Text>}

              <Text style={s.label}>How long should it run?</Text>
              <View style={s.chips}>
                {RUN_OPTIONS.map((d) => <Chip key={d} label={d === 7 ? '7 days · default' : `${d} days`} on={days === d} onPress={() => setDays(d)} />)}
              </View>
              <Stepper value={`${days} days`} onMinus={() => setDays(Math.max(1, days - 1))} onPlus={() => setDays(Math.min(90, days + 1))} caption={`ends ${endDateLabel(startAt, days)}`} />
              <Text style={s.hint}>You can extend it any time while it’s running.</Text>

              <Text style={s.label}>How do you want to pay?</Text>
              <RouteOption
                on={route === 'scalio'} onPress={() => setRoute('scalio')} disabledReason={builder.routes.scalio.reason}
                title="Pay with Scalio" subtitle="Card, bank transfer or USSD in naira. No dollar card needed." badge="Easiest"
              />
              <RouteOption
                on={route === 'own_meta'} onPress={() => setRoute('own_meta')} disabledReason={builder.routes.own_meta.reason}
                title="My own Meta ad account"
                subtitle={builder.routes.own_meta.available ? `Meta charges ${builder.routes.own_meta.paymentMethodLabel ?? 'your card'}; you pay Scalio’s fee only.` : 'Meta charges your card; you pay Scalio’s fee only.'}
              />
              <CostCard quote={quote.value} loading={quote.loading} />
            </>
          )}

          {key === 'review' && (
            <>
              <Text style={s.h2}>Check and launch</Text>
              <Field label="Ad name (only you see this)" value={name} onChangeText={setName} />
              <View style={s.card}>
                <ReviewRow label="Goal" value={`${objectiveInfo?.label} · ${DEST_LABELS[destination]}`} onEdit={() => go(steps.indexOf('goal'))} />
                <ReviewRow label="Who sees it" value={`${targeting.locations.map((l) => l.radiusKm ? `${l.name} +${l.radiusKm} km` : l.name).join(', ')} · ${targeting.ageMin}–${targeting.ageMax === 65 ? '65+' : targeting.ageMax} · ${targeting.genders === 'all' ? 'everyone' : targeting.genders === 'male' ? 'men' : 'women'}${targeting.interests.length ? ` · ${targeting.interests.map((i) => i.name).join(', ')}` : ''}`} onEdit={() => go(steps.indexOf('audience'))} />
                {mode === 'advanced' && <ReviewRow label="Placements" value={targeting.placements === 'automatic' ? 'Automatic' : 'Chosen by you'} onEdit={() => go(steps.indexOf('placements'))} />}
                <ReviewRow label="Ad" value={headline || '—'} onEdit={() => go(steps.indexOf('ad'))} />
                <ReviewRow label="Runs" value={`${naira(dailyBudgetKobo)}/day · ${days} days · ends ${endDateLabel(startAt, days)}`} onEdit={() => go(steps.indexOf('budget'))} />
                <ReviewRow label="Payment" value={route === 'scalio' ? 'Pay with Scalio' : 'My own Meta ad account'} onEdit={() => go(steps.indexOf('budget'))} last />
              </View>
              <CostCard quote={quote.value} loading={quote.loading} />
              <Text style={s.hint}>Meta reviews every ad before it runs — usually within 24 hours. If Meta doesn’t approve it, unspent money paid to Scalio comes back as ad credit.</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={s.footer}>
        {blocker && <Text style={s.blocker}>{blocker}</Text>}
        {key === 'review' ? (
          <Pressable style={[s.primary, (busy === 'pay' || !quote.value) && s.disabled]} onPress={() => void pay()} disabled={busy === 'pay' || !quote.value}>
            {busy === 'pay' ? <ActivityIndicator color={colors.white} /> : (
              <Text style={s.primaryText}>{quote.value && quote.value.dueNowKobo > 0 ? `Pay ${naira(quote.value.dueNowKobo)} and launch` : 'Launch ad'}</Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={[s.primary, !!blocker && s.disabled]} onPress={() => go(step + 1)} disabled={!!blocker}>
            <Text style={s.primaryText}>Continue</Text>
            <Feather name="arrow-right" size={18} color={colors.white} />
          </Pressable>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Audience ───────────────────────────────────────────────────────────────

function AudienceStep({ targeting, onChange, advanced, reach, reachLoading }: {
  targeting: AdTargeting; onChange: (t: AdTargeting) => void; advanced: boolean; reach: { lower: number; upper: number } | null; reachLoading: boolean;
}) {
  const s = useSStyles();
  const { colors } = useTheme();
  const [placeQ, setPlaceQ] = useState('');
  const [interestQ, setInterestQ] = useState('');
  const places = useDebounced<LocationOption[]>(() => searchAdLocations(placeQ), [placeQ], placeQ.trim().length >= 2);
  const interests = useDebounced<InterestOption[]>(() => searchAdInterests(interestQ), [interestQ], interestQ.trim().length >= 2);
  const names = targeting.interests.map((i) => i.name);
  const suggestions = useDebounced<InterestOption[]>(() => suggestAdInterests(names), [names.join('|')], names.length > 0);
  const chosen = new Set(targeting.interests.map((i) => i.id));
  const addInterest = (i: { id: string; name: string }) => !chosen.has(i.id) && onChange({ ...targeting, interests: [...targeting.interests, { id: i.id, name: i.name }].slice(0, 25) });

  // How wide the audience is, as a bar from "specific" to "broad".
  const breadth = reach ? Math.min(1, Math.max(0.05, Math.log10(Math.max(reach.upper, 1000)) / 7)) : 0;
  const bar = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(bar, { toValue: breadth, useNativeDriver: false, damping: 16, stiffness: 120 }).start(); }, [breadth, bar]);

  return (
    <>
      <Text style={s.h2}>Who should see it?</Text>
      <View style={s.reachCard}>
        <View style={s.rowBetween}>
          <Text style={s.label}>Audience size</Text>
          {reachLoading ? <ActivityIndicator size="small" color={colors.accent} /> : (
            <Text style={s.reachNum}>{reach ? `${compact(reach.lower)}–${compact(reach.upper)} people` : '—'}</Text>
          )}
        </View>
        <View style={s.reachTrack}><Animated.View style={[s.reachFill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
        <View style={s.rowBetween}><Text style={s.hint}>Specific</Text><Text style={s.hint}>Broad</Text></View>
      </View>

      <Text style={s.label}>Where</Text>
      {targeting.locations.map((l) => (
        <View key={l.key} style={s.locRow}>
          <Feather name="map-pin" size={16} color={colors.accent} />
          <Text style={[s.body, { flex: 1 }]}>{l.name}</Text>
          {l.type === 'city' && (
            <View style={s.chips}>
              {[5, 10, 25].map((km) => (
                <Chip key={km} small label={`+${km} km`} on={l.radiusKm === km} onPress={() => onChange({ ...targeting, locations: targeting.locations.map((x) => (x.key === l.key ? { ...x, radiusKm: km } : x)) })} />
              ))}
            </View>
          )}
          <Pressable onPress={() => onChange({ ...targeting, locations: targeting.locations.filter((x) => x.key !== l.key) })} hitSlop={8} accessibilityLabel={`Remove ${l.name}`}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}
      <SearchBox value={placeQ} onChangeText={setPlaceQ} placeholder="Add a city or state" />
      {placeQ.trim().length >= 2 && (places.value ?? []).map((p) => (
        <Pressable key={p.key} style={s.result} onPress={() => {
          if (!targeting.locations.some((l) => l.key === p.key)) {
            onChange({ ...targeting, locations: [...targeting.locations, { key: p.key, type: p.type, name: p.label, ...(p.type === 'city' ? { radiusKm: 10 } : {}) }] });
          }
          setPlaceQ('');
        }}>
          <Feather name="plus" size={14} color={colors.accent} /><Text style={s.body}>{p.label}</Text><Text style={s.hint}>{p.type}</Text>
        </Pressable>
      ))}

      <Text style={s.label}>Age</Text>
      <View style={s.rowGap}>
        <Stepper value={String(targeting.ageMin)} onMinus={() => onChange({ ...targeting, ageMin: Math.max(18, targeting.ageMin - 1) })} onPlus={() => onChange({ ...targeting, ageMin: Math.min(targeting.ageMax, targeting.ageMin + 1) })} />
        <Text style={s.muted}>to</Text>
        <Stepper value={targeting.ageMax === 65 ? '65+' : String(targeting.ageMax)} onMinus={() => onChange({ ...targeting, ageMax: Math.max(targeting.ageMin, targeting.ageMax - 1) })} onPlus={() => onChange({ ...targeting, ageMax: Math.min(65, targeting.ageMax + 1) })} />
      </View>

      <Text style={s.label}>Gender</Text>
      <View style={s.segment}>
        {(['all', 'female', 'male'] as const).map((g) => (
          <Pressable key={g} onPress={() => onChange({ ...targeting, genders: g })} style={[s.segmentItem, targeting.genders === g && s.segmentOn]}>
            <Text style={[s.segmentText, targeting.genders === g && s.segmentTextOn]}>{g === 'all' ? 'Everyone' : g === 'female' ? 'Women' : 'Men'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Interests {advanced ? '' : '(optional)'}</Text>
      <Text style={s.hint}>Type what your customers are into — like hairstyling or skincare.</Text>
      <View style={s.chips}>
        {targeting.interests.map((i) => (
          <Chip key={i.id} label={i.name} on icon="x" onPress={() => onChange({ ...targeting, interests: targeting.interests.filter((x) => x.id !== i.id) })} />
        ))}
      </View>
      <SearchBox value={interestQ} onChangeText={setInterestQ} placeholder="Search interests (e.g. skincare)" />
      {interestQ.trim().length >= 2 && (interests.value ?? []).slice(0, 8).map((i) => (
        <Pressable key={i.id} style={s.result} onPress={() => { addInterest(i); setInterestQ(''); }}>
          <Feather name="plus" size={14} color={colors.accent} />
          <Text style={[s.body, { flex: 1 }]}>{i.name}</Text>
          {i.audienceSize ? <Text style={s.hint}>{compact(i.audienceSize)}</Text> : null}
        </Pressable>
      ))}
      {interestQ.trim().length < 2 && (suggestions.value ?? []).filter((x) => !chosen.has(x.id)).length > 0 && (
        <>
          <Text style={s.hint}>Suggested for you</Text>
          <View style={s.chips}>
            {(suggestions.value ?? []).filter((x) => !chosen.has(x.id)).slice(0, 8).map((i) => <Chip key={i.id} label={i.name} icon="plus" onPress={() => addInterest(i)} />)}
          </View>
        </>
      )}
    </>
  );
}

// ── Small pieces ───────────────────────────────────────────────────────────

function Chip({ label, on, onPress, icon, small }: { label: string; on?: boolean; onPress: () => void; icon?: React.ComponentProps<typeof Feather>['name']; small?: boolean }) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[s.chip, small && s.chipSmall, on && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: !!on }}>
      {icon && <Feather name={icon} size={small ? 11 : 13} color={on ? colors.white : colors.accent} />}
      <Text style={[s.chipText, small && { fontSize: typography.size.xs }, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Stepper({ value, onMinus, onPlus, caption }: { value: string; onMinus: () => void; onPlus: () => void; caption?: string }) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <View style={s.stepperWrap}>
      <View style={s.stepper}>
        <Pressable onPress={onMinus} style={s.stepBtn} hitSlop={6} accessibilityLabel="Less"><Feather name="minus" size={16} color={colors.accent} /></Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable onPress={onPlus} style={s.stepBtn} hitSlop={6} accessibilityLabel="More"><Feather name="plus" size={16} color={colors.accent} /></Pressable>
      </View>
      {caption && <Text style={s.muted}>{caption}</Text>}
    </View>
  );
}

function Field({ label, counter, ...rest }: { label: string; counter?: number } & React.ComponentProps<typeof TextInput>) {
  const s = useSStyles();
  const { colors } = useTheme();
  const len = String(rest.value ?? '').length;
  return (
    <View style={{ gap: 4 }}>
      <View style={s.rowBetween}>
        <Text style={s.label}>{label}</Text>
        {counter ? <Text style={[s.hint, len > counter && { color: colors.warning }]}>{len}/{counter}</Text> : null}
      </View>
      <TextInput placeholderTextColor={colors.textMuted} {...rest} style={[s.input, rest.multiline && { minHeight: 84, textAlignVertical: 'top' }]} />
    </View>
  );
}

function SearchBox(props: React.ComponentProps<typeof TextInput>) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <View style={s.search}>
      <Feather name="search" size={15} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textMuted} autoCorrect={false} {...props} style={s.searchInput} />
    </View>
  );
}

function RouteOption({ on, onPress, title, subtitle, badge, disabledReason }: { on: boolean; onPress: () => void; title: string; subtitle: string; badge?: string; disabledReason: string | null }) {
  const s = useSStyles();
  const { colors } = useTheme();
  const disabled = !!disabledReason;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.option, on && !disabled && s.optionOn, disabled && { opacity: 0.6 }]} accessibilityRole="radio" accessibilityState={{ selected: on, disabled }}>
      <Feather name={on && !disabled ? 'check-circle' : 'circle'} size={20} color={on && !disabled ? colors.accent : colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.rowGap}><Text style={s.optionTitle}>{title}</Text>{badge && <Text style={s.badge}>{badge}</Text>}</View>
        <Text style={s.muted}>{disabled ? disabledReason : subtitle}</Text>
      </View>
    </Pressable>
  );
}

function CostCard({ quote, loading }: { quote: AdQuote | null; loading: boolean }) {
  const s = useSStyles();
  const { colors } = useTheme();
  if (!quote) return <View style={[s.card, s.center, { minHeight: 80 }]}><ActivityIndicator color={colors.accent} /></View>;
  const own = quote.route === 'own_meta';
  return (
    <View style={[s.card, loading && { opacity: 0.6 }]}>
      <CostRow label={`Ad spend (${quote.days} days × ${naira(quote.dailyBudgetKobo)})`} value={naira(quote.spendKobo)} />
      <CostRow label="VAT 7.5%" value={naira(quote.vatKobo)} />
      <CostRow label="Scalio fee" value={naira(quote.feeKobo)} />
      {quote.creditUsedKobo > 0 && <CostRow label="Ad credit used" value={`−${naira(quote.creditUsedKobo)}`} />}
      <View style={s.costTotal}>
        <Text style={s.optionTitle}>{own ? 'You pay Scalio now' : 'Total to pay now'}</Text>
        <Text style={s.total}>{naira(quote.dueNowKobo)}</Text>
      </View>
      {own && <Text style={s.hint}>Meta charges your card {naira(quote.metaChargesKobo)} (spend + VAT) as the ad runs.</Text>}
    </View>
  );
}

const CostRow = ({ label, value }: { label: string; value: string }) => {
  const s = useSStyles();
  return (
  <View style={s.rowBetween}><Text style={s.muted}>{label}</Text><Text style={s.body}>{value}</Text></View>);
};

const ReviewRow = ({ label, value, onEdit, last }: { label: string; value: string; onEdit: () => void; last?: boolean }) => {
  const s = useSStyles();
  return (
  <Pressable onPress={onEdit} style={[s.reviewRow, !last && s.divider]} accessibilityRole="button" accessibilityLabel={`Edit ${label}`}>
    <View style={{ flex: 1, gap: 2 }}><Text style={s.hint}>{label}</Text><Text style={s.body}>{value}</Text></View>
    <Text style={s.link}>Edit</Text>
  </Pressable>);
};

function AdPreview({ pageName, photoUri, text, headline, cta }: { pageName: string; photoUri: string | null; text: string; headline: string; cta: string }) {
  const s = useSStyles();
  const { colors } = useTheme();
  return (
    <View style={s.preview}>
      <Text style={s.hint}>Preview</Text>
      <View style={s.previewCard}>
        <View style={s.rowGap}>
          <View style={s.avatar}><Text style={s.avatarText}>{pageName.slice(0, 1)}</Text></View>
          <View><Text style={s.optionTitle}>{pageName}</Text><Text style={s.hint}>Sponsored</Text></View>
        </View>
        <Text style={s.body} numberOfLines={3}>{text || 'Your ad text appears here.'}</Text>
        {photoUri ? <Image source={{ uri: photoUri }} style={s.previewImg} /> : <View style={[s.previewImg, s.center, { backgroundColor: colors.mist }]}><Feather name="image" size={24} color={colors.textMuted} /></View>}
        <View style={s.previewCta}>
          <Text style={[s.optionTitle, { flex: 1 }]} numberOfLines={1}>{headline || 'Your headline'}</Text>
          <View style={s.ctaBtn}><Text style={s.ctaText}>{cta}</Text></View>
        </View>
      </View>
    </View>
  );
}

const useSStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  title: { flex: 1, fontSize: 22, letterSpacing: -0.6, lineHeight: 28, fontWeight: '700', color: colors.text },
  modeToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.accentLight },
  modeText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.accent },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  h2: { fontSize: typography.size.title, fontWeight: typography.weight.semibold, color: colors.text },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text, marginTop: spacing.xs },
  body: { fontSize: typography.size.base, color: colors.text },
  muted: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 19 },
  hint: { fontSize: typography.size.xs, color: colors.textMuted, lineHeight: 16 },
  link: { color: colors.accent, fontWeight: typography.weight.medium, fontSize: typography.size.sm },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  optionOn: { borderColor: colors.accent, backgroundColor: '#f5f8ff' },
  optionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentLight },
  optionIconOn: { backgroundColor: colors.accent },
  optionTitle: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.text },
  badge: { fontSize: 10, fontWeight: typography.weight.medium, color: colors.success, backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipSmall: { paddingHorizontal: 8, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.accent },
  chipTextOn: { color: colors.white },
  card: { backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: typography.size.base, color: colors.text },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: typography.size.base, color: colors.text },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, paddingHorizontal: spacing.md, backgroundColor: colors.background, borderRadius: radius.md },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexWrap: 'wrap' },
  reachCard: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  reachNum: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.accent },
  reachTrack: { height: 6, borderRadius: 3, backgroundColor: colors.mist, overflow: 'hidden' },
  reachFill: { height: '100%', borderRadius: 3, backgroundColor: colors.success },
  segment: { flexDirection: 'row', backgroundColor: colors.mist, borderRadius: radius.pill, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.background },
  segmentText: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textSecondary },
  segmentTextOn: { color: colors.accent },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 72, textAlign: 'center', fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.text, fontVariant: ['tabular-nums'] },
  photo: { height: 190, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  aiBox: { backgroundColor: '#f5f8ff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accentLight, padding: spacing.lg, gap: spacing.sm },
  secondaryBtn: { borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent, paddingVertical: 10, alignItems: 'center' },
  secondaryText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  variant: { width: 220, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, gap: 4 },
  variantOn: { borderColor: colors.accent },
  variantAngle: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.4 },
  preview: { gap: spacing.xs, marginTop: spacing.sm },
  previewCard: { backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: typography.weight.medium },
  previewImg: { width: '100%', aspectRatio: 1, borderRadius: radius.md },
  previewCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md },
  ctaBtn: { backgroundColor: colors.mist, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  ctaText: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, color: colors.text },
  costTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  total: { fontSize: typography.size.title, fontWeight: typography.weight.semibold, color: colors.text },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  footer: { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  blocker: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center' },
  primary: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.semibold, fontSize: typography.size.md },
  disabled: { opacity: 0.45 },
}));
