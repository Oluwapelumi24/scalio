import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Discover Trusted Businesses Around You',
    subtitle: 'Find salons, spas, barbershops, wellness centres and more — all in one place.',
    icon: 'compass' as const,
  },
  {
    title: 'Book in Seconds, Anytime',
    subtitle: "Pick your service, choose a time that works, and you're done. It really is that easy.",
    icon: 'calendar' as const,
  },
  {
    title: 'Pay Your Way, Every Time',
    subtitle: 'Pay on arrival, leave a deposit, or prepay in full — whatever works for you.',
    icon: 'credit-card' as const,
  },
] as const;

export function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }

  function handleNext() {
    if (isLastSlide) {
      navigation.navigate('InterestSelection');
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.iconBadge}>
              <Feather name={slide.icon} size={44} color="#ffffff" />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <View key={slide.title} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaLabel}>{isLastSlide ? 'Get started' : 'Next'}</Text>
        </Pressable>

        {!isLastSlide && (
          <Pressable style={styles.skip} onPress={() => navigation.navigate('InterestSelection')}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: spacing.xl,
    paddingTop: 120,
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 30,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: spacing.sm,
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  cta: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#0f0c29',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  skip: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  skipLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
