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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Book your next appointment in seconds',
    subtitle: 'Find your salon, pick a time that works for you, and we’ll handle the rest.',
  },
  {
    title: 'Discover trusted businesses near you',
    subtitle: 'Browse salons, spas, and studios with real services, real prices, and real availability.',
  },
  {
    title: 'Pay your way, every time',
    subtitle: 'Pay on arrival, leave a deposit, or prepay in full — whatever the business and you prefer.',
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
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.copy}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  slide: {
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  copy: {},
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 64,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dddddd',
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: '#111111',
    width: 20,
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skip: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipLabel: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '600',
  },
});
