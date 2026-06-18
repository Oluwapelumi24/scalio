import { useEffect, useRef } from 'react';
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
import { radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');

const IMAGES = {
  spa: require('../../assets/onboarding/spa.jpg') as ImageSourcePropType,
  salon: require('../../assets/onboarding/salon.jpg') as ImageSourcePropType,
  nails: require('../../assets/onboarding/nails.jpg') as ImageSourcePropType,
  fitness: require('../../assets/onboarding/fitness.jpg') as ImageSourcePropType,
  laundromat: require('../../assets/onboarding/laundromat.jpg') as ImageSourcePropType,
};

const COL_GAP = 10;
const MOSAIC_H = H * 0.58;
const SIDE_IMG_H = (MOSAIC_H - COL_GAP) / 2;
const CENTER_IMG_H = MOSAIC_H * 0.9;

// Gentle float: slow sine-wave drift, much less motion than infinite scroll
function useFloatAnim(amplitude: number, duration: number, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -amplitude,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    if (delay > 0) {
      const id = setTimeout(run, delay);
      return () => clearTimeout(id);
    }
    run();
  }, [anim, amplitude, duration, delay]);

  return anim;
}

export function OnboardingScreen({ navigation }: Props) {
  const leftFloat = useFloatAnim(10, 5000, 0);
  const centerFloat = useFloatAnim(7, 6000, 700);
  const rightFloat = useFloatAnim(9, 5400, 1400);

  return (
    <View style={styles.root}>
      {/* Photo mosaic */}
      <View style={styles.mosaicContainer}>
        <View style={styles.mosaic}>
          {/* Left column: 2 stacked images */}
          <Animated.View style={[styles.sideCol, { transform: [{ translateY: leftFloat }] }]}>
            <Image source={IMAGES.spa} style={styles.sideImg} resizeMode="cover" />
            <Image source={IMAGES.nails} style={styles.sideImg} resizeMode="cover" />
          </Animated.View>

          {/* Center column: 1 large featured image, offset down */}
          <Animated.View
            style={[styles.centerCol, { marginTop: 32, transform: [{ translateY: centerFloat }] }]}
          >
            <Image source={IMAGES.salon} style={styles.centerImg} resizeMode="cover" />
          </Animated.View>

          {/* Right column: 2 stacked images, slight negative offset for stagger */}
          <Animated.View
            style={[styles.sideCol, { marginTop: -18, transform: [{ translateY: rightFloat }] }]}
          >
            <Image source={IMAGES.fitness} style={styles.sideImg} resizeMode="cover" />
            <Image source={IMAGES.laundromat} style={styles.sideImg} resizeMode="cover" />
          </Animated.View>
        </View>

        {/* Fade to white at bottom of mosaic */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.55)', '#ffffff']}
          locations={[0.72, 0.9, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Bottom content */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>S</Text>
        </View>

        <Text style={styles.headline}>
          Curated experiences and services,{'\n'}designed around you.
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.82 }]}
            onPress={() => navigation.navigate('OnboardingInfo')}
          >
            <Text style={styles.ctaLabel}>Get started</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.loginLabel}>Sign in</Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mosaicContainer: {
    height: MOSAIC_H,
    overflow: 'hidden',
  },
  mosaic: {
    flexDirection: 'row',
    gap: COL_GAP,
    paddingHorizontal: COL_GAP,
    paddingTop: COL_GAP,
  },
  sideCol: {
    flex: 1,
    gap: COL_GAP,
  },
  sideImg: {
    width: '100%',
    height: SIDE_IMG_H,
    borderRadius: 16,
    backgroundColor: '#eeeeee',
  },
  centerCol: {
    flex: 2,
  },
  centerImg: {
    width: '100%',
    height: CENTER_IMG_H,
    borderRadius: 20,
    backgroundColor: '#eeeeee',
  },
  footer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 30,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
  loginBtn: {
    backgroundColor: '#f3f3f3',
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
  },
  loginLabel: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: '#111111',
  },
  terms: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    fontWeight: '700',
    color: '#555555',
  },
});
