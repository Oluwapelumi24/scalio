import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Button } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { height: H } = Dimensions.get('window');

const SLIDE_MS = 5000;

const IMAGES = {
  spa:        require('../../assets/onboarding/spa.jpg') as ImageSourcePropType,
  salon:      require('../../assets/onboarding/salon.jpg') as ImageSourcePropType,
  nails:      require('../../assets/onboarding/nails.jpg') as ImageSourcePropType,
  fitness:    require('../../assets/onboarding/fitness.jpg') as ImageSourcePropType,
  laundromat: require('../../assets/onboarding/laundromat.jpg') as ImageSourcePropType,
};

const SLIDES = [
  { title: 'Everything local, handpicked for you', body: 'Salons, spas, cleaners and more. The best of your city, one tap away.' },
  { title: 'Book in seconds, no calls', body: 'Pick a service, choose a free time and you’re confirmed.' },
  { title: 'Pay the way that suits you', body: 'Pay on arrival, leave a deposit or prepay in full.' },
];

// Photo mosaic
const GAP      = 9;
const MOSAIC_H = H * 0.44;
const SIDE_H   = (MOSAIC_H - GAP) / 2;
const CENTER_H = MOSAIC_H * 0.9;

/** Slow sine drift for the photos. */
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

/** Story-style intro, like the vendor app: segments fill across the top and the slides move on by themselves. */
export function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const lFloat = useFloat(10, 5000, 0);
  const cFloat = useFloat(7,  6000, 700);
  const rFloat = useFloat(9,  5400, 1400);

  useEffect(() => {
    progress.setValue(0);
    const run = Animated.timing(progress, { toValue: 1, duration: SLIDE_MS, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => {
      if (finished) setIndex((i) => (i + 1) % SLIDES.length);
    });
    return () => run.stop();
  }, [index, progress]);

  const slide = SLIDES[index];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.segments} accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, i) => (
          <View key={i} style={styles.segment}>
            <Animated.View
              style={[
                styles.segmentFill,
                {
                  width:
                    i < index ? '100%'
                    : i === index ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                    : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>scalio</Text>
      </View>

      <View style={styles.mosaicWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.mosaic}>
          <Animated.View style={[styles.sideCol, { transform: [{ translateY: lFloat }] }]}>
            <Image source={IMAGES.spa}   style={styles.sideImg} resizeMode="cover" />
            <Image source={IMAGES.nails} style={styles.sideImg} resizeMode="cover" />
          </Animated.View>
          <Animated.View style={[styles.centerCol, { marginTop: 32, transform: [{ translateY: cFloat }] }]}>
            <Image source={IMAGES.salon} style={styles.centerImg} resizeMode="cover" />
          </Animated.View>
          <Animated.View style={[styles.sideCol, { marginTop: -18, transform: [{ translateY: rFloat }] }]}>
            <Image source={IMAGES.fitness}    style={styles.sideImg} resizeMode="cover" />
            <Image source={IMAGES.laundromat} style={styles.sideImg} resizeMode="cover" />
          </Animated.View>
        </View>
        {/* Fade the photos into the page */}
        <LinearGradient
          colors={['transparent', colors.background]}
          locations={[0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Tap the left or right half to go back or forward */}
      <View style={styles.stage}>
        <View style={styles.slide} pointerEvents="none">
          <Text style={styles.title} accessibilityRole="header">{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>
        <Pressable style={styles.half} onPress={() => setIndex(Math.max(0, index - 1))} accessibilityLabel="Previous slide" />
        <Pressable style={styles.half} onPress={() => setIndex((index + 1) % SLIDES.length)} accessibilityLabel="Next slide" />
      </View>

      <View style={styles.footer}>
        <Button label="Get started" onPress={() => navigation.navigate('InterestSelection')} />
        <Pressable onPress={() => navigation.navigate('SignIn', { mode: 'onboarding' })} hitSlop={8} accessibilityRole="button">
          <Text style={styles.signIn}>I already have an account</Text>
        </Pressable>
        <Text style={styles.terms}>
          By continuing you agree to our <Text style={styles.termsLink}>Terms</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  segments: { flexDirection: 'row', gap: 6, paddingHorizontal: GUTTER, paddingTop: 12 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  segmentFill: { height: 3, backgroundColor: colors.accent },

  wordmarkRow: { alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  wordmark: { fontSize: 17, fontWeight: '700', letterSpacing: 2, color: colors.text },

  mosaicWrap: { height: MOSAIC_H, overflow: 'hidden' },
  mosaic: { flexDirection: 'row', gap: GAP, paddingHorizontal: GAP },
  sideCol: { flex: 1, gap: GAP },
  centerCol: { flex: 2 },
  sideImg: { width: '100%', height: SIDE_H, borderRadius: 18, backgroundColor: colors.surface },
  centerImg: { width: '100%', height: CENTER_H, borderRadius: 22, backgroundColor: colors.surface },

  stage: { flex: 1, flexDirection: 'row' },
  half: { flex: 1 },
  slide: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: GUTTER,
  },
  title: { fontSize: 21, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.text, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },

  footer: { paddingHorizontal: GUTTER, paddingBottom: 12, gap: 18 },
  signIn: { fontSize: 14, fontWeight: '600', color: colors.link, textAlign: 'center' },
  terms: { fontSize: 12, lineHeight: 17, color: colors.textMuted, textAlign: 'center' },
  termsLink: { fontWeight: '600', color: colors.textSecondary },
}));
