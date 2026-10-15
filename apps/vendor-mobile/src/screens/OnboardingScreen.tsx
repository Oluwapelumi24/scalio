import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { markOnboardingSeen } from '../lib/preferences';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const { width: W } = Dimensions.get('window');

interface Slide {
  title: string;
  body: string;
  cta: string;
  icons: { icon: FeatherName; bg: string; x: number; y: number; size: number }[];
}

// Three short screens: Scalio is more than bookings. Business setup happens later,
// in context — nobody has to finish it before exploring the app.
const SLIDES: Slide[] = [
  {
    title: 'Doing business\nthe right way',
    body: 'Everything you need to run your business, all in one place.',
    cta: 'Get started',
    icons: [
      { icon: 'calendar', bg: '#1e3a8a', x: 0, y: 0, size: 64 },
      { icon: 'users', bg: '#0d9488', x: 76, y: 40, size: 48 },
      { icon: 'scissors', bg: '#7c3aed', x: -78, y: 48, size: 48 },
      { icon: 'bell', bg: '#0f766e', x: 52, y: -30, size: 40 },
    ],
  },
  {
    title: 'Grow your\nbusiness',
    body: 'Find more customers and turn them into regular buyers.',
    cta: 'Continue',
    icons: [
      { icon: 'share-2', bg: '#1e3a8a', x: 0, y: 0, size: 64 },
      { icon: 'image', bg: '#db2777', x: 76, y: 40, size: 48 },
      { icon: 'repeat', bg: '#0d9488', x: -78, y: 48, size: 48 },
      { icon: 'star', bg: '#d97706', x: 52, y: -30, size: 40 },
    ],
  },
  {
    title: 'Run your business\nwith ease',
    body: 'Manage your people, money, and daily work with less stress.',
    cta: "Let's go",
    icons: [
      { icon: 'users', bg: '#1e3a8a', x: 0, y: 0, size: 64 },
      { icon: 'credit-card', bg: '#0d9488', x: 76, y: 40, size: 48 },
      { icon: 'bar-chart-2', bg: '#d97706', x: -78, y: 48, size: 48 },
      { icon: 'calendar', bg: '#7c3aed', x: 52, y: -30, size: 40 },
    ],
  },
];

function Illustration({ icons }: { icons: Slide['icons'] }) {
  const cx = (W - spacing.xl * 2) / 2;
  return (
    <View style={ill.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={ill.card}>
        <View style={ill.bar} />
        <View style={[ill.bar, { width: '70%', opacity: 0.5 }]} />
        <View style={ill.bar} />
        <View style={[ill.bar, { width: '55%', opacity: 0.5 }]} />
      </View>
      {icons.map(({ icon, bg, x, y, size }) => (
        <View
          key={icon + x}
          style={[
            ill.bubble,
            { backgroundColor: bg, width: size, height: size, borderRadius: size / 2, left: cx + x - size / 2, top: y + 50 },
          ]}
        >
          <Feather name={icon} size={size * 0.42} color={colors.white} />
        </View>
      ))}
    </View>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  async function finish() {
    await markOnboardingSeen();
    navigation.replace('Register');
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.topNav}>
        {index > 0 ? (
          <Pressable onPress={() => setIndex(index - 1)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View />
        )}
        {!isLast && (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text style={s.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <View style={s.body}>
        <Illustration icons={slide.icons} />
        <Text style={s.title} accessibilityRole="header">{slide.title}</Text>
        <Text style={s.text}>{slide.body}</Text>
      </View>

      <View style={s.footer}>
        <View style={s.dots} accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.cta, pressed && { opacity: 0.88 }]}
          onPress={() => (isLast ? finish() : setIndex(index + 1))}
          accessibilityRole="button"
        >
          <Text style={s.ctaLabel}>{slide.cta}</Text>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={s.signIn}>
            Already have an account? <Text style={s.signInBold}>Sign in</Text>
          </Text>
        </Pressable>

        <View style={s.legal}>
          <Text style={s.legalLink}>Terms of Service</Text>
          <Text style={s.legalLink}>·</Text>
          <Text style={s.legalLink}>Privacy Policy</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const ill = StyleSheet.create({
  root: { width: '100%', height: 220, marginTop: spacing.lg, marginBottom: spacing.xl },
  card: {
    position: 'absolute',
    left: W * 0.08,
    right: W * 0.08,
    top: 70,
    backgroundColor: '#f0f4ff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  bar: { height: 10, width: '100%', borderRadius: 5, backgroundColor: '#c7d7f8' },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    minHeight: 44,
  },
  skip: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textMuted },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  text: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  footer: { paddingBottom: spacing.md, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.accent },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.pill,
    marginHorizontal: spacing.xl,
  },
  ctaLabel: { color: colors.white, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  signIn: { textAlign: 'center', fontSize: typography.size.sm, color: colors.textMuted },
  signInBold: { color: colors.accent, fontWeight: typography.weight.semibold },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  legalLink: { fontSize: typography.size.xs, color: colors.textMuted },
});
