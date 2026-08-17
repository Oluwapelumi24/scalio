import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG            = '#F6F2EC';   // warm ivory — anchors the whole palette
const HEADING       = '#18140F';   // deep warm black
const BODY_COLOR    = '#7A6F65';   // warm mid-gray
const MUTED         = '#B5ADA4';   // faded warm gray for terms
const DOT_INACTIVE  = '#DDD7CF';
const CTA_BG        = '#000000';
const SIGN_IN_BG    = '#EDE8DF';   // warm secondary button
// Georgia is a standard iOS system serif — premium editorial feel, zero load time
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Images ───────────────────────────────────────────────────────────────────
const IMAGES = {
  spa:        require('../../assets/onboarding/spa.jpg') as ImageSourcePropType,
  salon:      require('../../assets/onboarding/salon.jpg') as ImageSourcePropType,
  nails:      require('../../assets/onboarding/nails.jpg') as ImageSourcePropType,
  fitness:    require('../../assets/onboarding/fitness.jpg') as ImageSourcePropType,
  laundromat: require('../../assets/onboarding/laundromat.jpg') as ImageSourcePropType,
};

// ─── Carousel content ─────────────────────────────────────────────────────────
// Each slide gets its own warm accent so the dot + rule pulse with meaning
const SLIDES = [
  {
    accent: '#1E3A8A',
    label: 'DISCOVER',
    title: 'Everything local,\nhandpicked for you.',
    body: 'Salons, spas, cleaners and more — the best of your city, one tap away.',
  },
  {
    accent: '#9E6E96',   // warm mauve
    label: 'BOOK',
    title: 'Your time,\nyour terms',
    body: 'Pick a service, choose your slot — confirmed in seconds. No calls needed.',
  },
  {
    accent: '#5E9486',   // sage teal
    label: 'PAY',
    title: 'Flexible payment,\nevery visit',
    body: 'Pay on arrival, drop a deposit, or prepay in full. Your choice, always.',
  },
] as const;


// ─── Mosaic layout ────────────────────────────────────────────────────────────
const GAP       = 9;
const MOSAIC_H  = H * 0.47;
const SIDE_H    = (MOSAIC_H - GAP) / 2;
const CENTER_H  = MOSAIC_H * 0.9;

// ─── Float animation (sine-wave drift, easy on the eye) ──────────────────────
function useFloat(amp: number, ms: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: -amp, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0,    duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    if (delay) { const t = setTimeout(run, delay); return () => clearTimeout(t); }
    run();
  }, [v, amp, ms, delay]);
  return v;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function OnboardingScreen({ navigation }: Props) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slide = SLIDES[active];

  const lFloat = useFloat(10, 5000, 0);
  const cFloat = useFloat(7,  6000, 700);
  const rFloat = useFloat(9,  5400, 1400);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setActive(Math.round(e.nativeEvent.contentOffset.x / W));
  }

  return (
    <View style={s.root}>

      {/* ─── Photo mosaic ──────────────────────────────────────────────────── */}
      <View style={s.mosaicWrap}>
        <View style={s.mosaic}>
          <Animated.View style={[s.sideCol, { transform: [{ translateY: lFloat }] }]}>
            <Image source={IMAGES.spa}   style={s.sideImg} resizeMode="cover" />
            <Image source={IMAGES.nails} style={s.sideImg} resizeMode="cover" />
          </Animated.View>
          <Animated.View style={[s.centerCol, { marginTop: 32, transform: [{ translateY: cFloat }] }]}>
            <Image source={IMAGES.salon} style={s.centerImg} resizeMode="cover" />
          </Animated.View>
          <Animated.View style={[s.sideCol, { marginTop: -18, transform: [{ translateY: rFloat }] }]}>
            <Image source={IMAGES.fitness}    style={s.sideImg} resizeMode="cover" />
            <Image source={IMAGES.laundromat} style={s.sideImg} resizeMode="cover" />
          </Animated.View>
        </View>

        {/* Brand wordmark floats over the mosaic — immediately establishes identity */}
        <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="none" edges={['top']}>
          <View style={s.brandOverlay}>
            <View style={s.wordmarkPill}>
              <Text style={s.wordmark}>scalio</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Subtle top vignette to keep wordmark legible */}
        <LinearGradient
          colors={['rgba(30,18,10,0.38)', 'transparent']}
          locations={[0, 0.36]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Bottom fade into warm bg */}
        <LinearGradient
          colors={['transparent', 'rgba(246,242,236,0.72)', BG]}
          locations={[0.62, 0.86, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* ─── Info carousel ─────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={s.carousel}
      >
        {SLIDES.map((sl) => (
          <View key={sl.label} style={[s.slide, { width: W }]}>
            {/* Accent rule + category label — editorial, replaces generic icon */}
            <View style={s.accentRow}>
              <View style={[s.rule, { backgroundColor: sl.accent }]} />
              <Text style={[s.slideLabel, { color: sl.accent }]}>{sl.label}</Text>
            </View>
            <Text style={s.headline}>{sl.title}</Text>
            <Text style={s.slideBody}>{sl.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <SafeAreaView style={s.footer} edges={['bottom']}>
        {/* Progress dots */}
        <View style={s.dots}>
          {SLIDES.map((sl, i) => (
            <View
              key={sl.label}
              style={[
                s.dot,
                i === active && { width: 26, backgroundColor: slide.accent },
              ]}
            />
          ))}
        </View>

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [s.cta, pressed && { opacity: 0.87 }]}
          onPress={() => navigation.navigate('InterestSelection')}
        >
          <Text style={s.ctaLabel}>Get started</Text>
        </Pressable>

        {/* Secondary */}
        <Pressable
          style={({ pressed }) => [s.signIn, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('SignIn', { mode: 'onboarding' })}
        >
          <Text style={s.signInLabel}>Sign in</Text>
        </Pressable>

        <Text style={s.terms}>
          By continuing you agree to our{' '}
          <Text style={s.termsLink}>Terms</Text>
          {' '}and{' '}
          <Text style={s.termsLink}>Privacy Policy</Text>.
        </Text>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Mosaic
  mosaicWrap:  { height: MOSAIC_H, overflow: 'hidden' },
  mosaic:      { flexDirection: 'row', gap: GAP, paddingHorizontal: GAP, paddingTop: GAP },
  sideCol:     { flex: 1, gap: GAP },
  centerCol:   { flex: 2 },
  sideImg:     { width: '100%', height: SIDE_H,   borderRadius: 15, backgroundColor: '#E4DDD4' },
  centerImg:   { width: '100%', height: CENTER_H, borderRadius: 20, backgroundColor: '#E4DDD4' },

  // Brand wordmark overlay
  brandOverlay: {
    paddingTop: 14,
    alignItems: 'center',
  },
  wordmarkPill: {
    backgroundColor: 'rgba(24,20,15,0.72)',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 30,
  },
  wordmark: {
    fontFamily: SERIF,
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 5,
  },

  // Carousel
  carousel: { flex: 1 },
  slide:    { paddingHorizontal: 26, paddingTop: 18, justifyContent: 'center' },

  accentRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rule:       { width: 32, height: 3, borderRadius: 2 },
  slideLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5 },

  headline: {
    fontFamily: SERIF,
    fontSize: 27,
    fontWeight: '700',
    color: HEADING,
    lineHeight: 36,
    marginBottom: 10,
  },
  slideBody: {
    fontSize: 14,
    color: BODY_COLOR,
    lineHeight: 21,
  },

  // Footer
  footer: { paddingHorizontal: 22, paddingBottom: 6, gap: 10 },

  dots: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: DOT_INACTIVE },

  cta: {
    backgroundColor: CTA_BG,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaLabel: {
    fontFamily: SERIF,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  signIn: {
    backgroundColor: SIGN_IN_BG,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  signInLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: HEADING,
  },

  terms: {
    fontSize: 10.5,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: 2,
  },
  termsLink: { fontWeight: '700', color: '#8A807A' },
});
