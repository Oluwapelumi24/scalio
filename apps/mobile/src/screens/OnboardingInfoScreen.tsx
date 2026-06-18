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
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { BackButton } from '../components/BackButton';
import { radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingInfo'>;

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'compass' as const,
    accent: '#FF6F91',
    title: 'Discover trusted\nbusinesses around you',
    body: 'Find salons, spas, barbershops, wellness centres and more — all curated and trusted.',
  },
  {
    icon: 'calendar' as const,
    accent: '#00BCD4',
    title: 'Book in seconds,\nanytime',
    body: "Pick your service, choose a time that works, and you're done. No phone calls needed.",
  },
  {
    icon: 'credit-card' as const,
    accent: '#4CAF50',
    title: 'Pay your way,\nevery time',
    body: 'Pay on arrival, leave a deposit, or prepay in full — whatever suits you.',
  },
] as const;

export function OnboardingInfoScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(idx);
  }

  function handleNext() {
    if (isLast) {
      navigation.navigate('InterestSelection');
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * W, animated: true });
  }

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BackButton onPress={() => navigation.goBack()} />
        {/* Skip */}
        {!isLast && (
          <Pressable
            style={styles.skipBtn}
            onPress={() => navigation.navigate('InterestSelection')}
          >
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        )}

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scroller}
        >
          {SLIDES.map((s) => (
            <View key={s.title} style={[styles.slide, { width: W }]}>
              {/* Icon badge */}
              <View style={[styles.iconRing, { borderColor: s.accent + '55' }]}>
                <View style={[styles.iconInner, { backgroundColor: s.accent + '22' }]}>
                  <Feather name={s.icon} size={48} color={s.accent} />
                </View>
              </View>

              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideBody}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={s.title}
                style={[
                  styles.dot,
                  i === activeIndex && [styles.dotActive, { backgroundColor: slide.accent }],
                ]}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: slide.accent },
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleNext}
          >
            <Text style={styles.ctaLabel}>{isLast ? 'Choose my interests' : 'Next'}</Text>
            <Feather name={isLast ? 'arrow-right' : 'chevron-right'} size={18} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  skipLabel: {
    fontSize: typography.size.base,
    color: '#aaaaaa',
    fontWeight: typography.weight.semibold,
  },
  scroller: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: spacing.xl,
    paddingTop: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 38,
    marginBottom: spacing.lg,
  },
  slideBody: {
    fontSize: typography.size.lg,
    color: '#666666',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dddddd',
  },
  dotActive: {
    width: 24,
  },
  cta: {
    borderRadius: radius.pill,
    paddingVertical: 17,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaLabel: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
});
