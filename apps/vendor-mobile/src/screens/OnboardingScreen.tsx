import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { markOnboardingSeen } from '../lib/preferences';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W } = Dimensions.get('window');

// ─── Progress bar ─────────────────────────────────────────────────────────────

const TOTAL_Q = 4;

function ProgressBar({ step }: { step: number }) {
  // step 0 = splash (no bar shown); step 1–4 = questions
  if (step === 0) return null;
  return (
    <View style={prog.row}>
      {Array.from({ length: TOTAL_Q }).map((_, i) => (
        <View
          key={i}
          style={[prog.seg, i < step && prog.segFilled]}
        />
      ))}
    </View>
  );
}

const prog = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segFilled: {
    backgroundColor: colors.accent,
  },
});

// ─── Option card (single or multi select) ────────────────────────────────────

function OptionCard({
  label,
  selected,
  onPress,
  multi = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <Pressable
      style={[opt.card, selected && opt.cardSelected]}
      onPress={onPress}
    >
      <Text style={[opt.label, selected && opt.labelSelected]}>{label}</Text>
      <View style={[opt.indicator, selected && opt.indicatorSelected]}>
        {selected && (
          multi
            ? <Feather name="check" size={13} color="#fff" />
            : <View style={opt.radioDot} />
        )}
      </View>
    </Pressable>
  );
}

const opt = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#eef2ff',
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text,
    flex: 1,
  },
  labelSelected: {
    fontWeight: typography.weight.semibold,
    color: colors.accent,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  indicatorSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

// ─── CTA button ───────────────────────────────────────────────────────────────

function CTAButton({
  label,
  onPress,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        cta.btn,
        disabled && cta.btnDisabled,
        pressed && !disabled && cta.btnPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={cta.label}>{label}</Text>
      {icon}
    </Pressable>
  );
}

const cta = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.pill,
    marginHorizontal: spacing.xl,
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
  },
  btnPressed: {
    opacity: 0.88,
  },
  label: {
    color: '#fff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
});

// ─── Splash illustration ──────────────────────────────────────────────────────

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const FEATURE_ICONS: { icon: FeatherName; bg: string; x: number; y: number; size: number }[] = [
  { icon: 'calendar',   bg: '#1e3a8a', x: W / 2 - 32, y: 0,   size: 64 },
  { icon: 'users',      bg: '#0d9488', x: W / 2 + 44, y: 40,  size: 48 },
  { icon: 'scissors',   bg: '#7c3aed', x: W / 2 - 110, y: 48, size: 48 },
  { icon: 'bar-chart-2',bg: '#d97706', x: W / 2 - 24,  y: 80, size: 48 },
  { icon: 'bell',       bg: '#0f766e', x: W / 2 + 20,  y: -30,size: 40 },
];

function SplashIllustration() {
  return (
    <View style={ill.root}>
      {/* Background card */}
      <View style={ill.card}>
        <View style={ill.cardBar} />
        <View style={[ill.cardBar, { width: '70%', opacity: 0.5 }]} />
        <View style={ill.cardBar} />
        <View style={[ill.cardBar, { width: '55%', opacity: 0.5 }]} />
      </View>

      {/* Floating icon bubbles */}
      {FEATURE_ICONS.map(({ icon, bg, x, y, size }, i) => (
        <View
          key={i}
          style={[
            ill.bubble,
            {
              backgroundColor: bg,
              width: size,
              height: size,
              borderRadius: size / 2,
              left: x - size / 2,
              top: y + 20,
            },
          ]}
        >
          <Feather name={icon} size={size * 0.42} color="#fff" />
        </View>
      ))}
    </View>
  );
}

const ill = StyleSheet.create({
  root: {
    width: W - spacing.xl * 4,
    height: 200,
    alignSelf: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    left: W * 0.05,
    right: W * 0.05,
    top: 40,
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
  cardBar: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#c7d7f8',
  },
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

// ─── Screen ───────────────────────────────────────────────────────────────────

interface Answers {
  businessType: string[];
  teamSize: string;
  serviceLocation: string[];
  source: string;
}

export function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    businessType: [],
    teamSize: '',
    serviceLocation: [],
    source: '',
  });

  async function finish() {
    await markOnboardingSeen();
    navigation.replace('Register');
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
    else setStep(0);
  }

  function toggleMulti(key: keyof Answers, value: string) {
    setAnswers((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function setSingle(key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  // ─ Step 0: Splash ──────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <View style={s.splashBody}>
          <SplashIllustration />
          <Text style={s.splashTitle}>Everything you need{'\n'}to run your business</Text>
          <Text style={s.splashSub}>
            Manage bookings, track clients, and grow your beauty business — all in one place.
          </Text>
        </View>

        <View style={s.splashFooter}>
          <CTAButton
            label="Get started"
            onPress={() => setStep(1)}
          />
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={s.signInLink}>Already have an account? <Text style={s.signInLinkBold}>Sign in</Text></Text>
          </Pressable>
          <View style={s.footerLinks}>
            <Text style={s.footerLink}>Support</Text>
            <Text style={s.footerDot}>·</Text>
            <Text style={s.footerLink}>Privacy Policy</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─ Shared Q screen wrapper ─────────────────────────────────────────────────
  const isLast = step === TOTAL_Q;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Top nav */}
      <View style={s.topNav}>
        <Pressable onPress={back} style={s.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={12}>
          <Text style={s.saveExit}>Sign in</Text>
        </Pressable>
      </View>

      <ProgressBar step={step} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Business type ── */}
        {step === 1 && (
          <>
            <Text style={s.stepLabel}>Business setup</Text>
            <Text style={s.question}>What type of{'\n'}business do you run?</Text>
            <Text style={s.hint}>Select all that apply</Text>
            <View style={s.options}>
              {['Nail studio', 'Hair salon', 'Barbershop', 'Spa & wellness', 'Lash & brow', 'Makeup artist', 'Other'].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={answers.businessType.includes(opt)}
                  onPress={() => toggleMulti('businessType', opt)}
                  multi
                />
              ))}
            </View>
          </>
        )}

        {/* ── Step 2: Team size ── */}
        {step === 2 && (
          <>
            <Text style={s.stepLabel}>Business setup</Text>
            <Text style={s.question}>How big is{'\n'}your team?</Text>
            <Text style={s.hint}>This helps us configure your scheduling correctly</Text>
            <View style={s.options}>
              {["Just me", "2–5 people", "6–10 people", "11–20 people", "20+ people"].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={answers.teamSize === opt}
                  onPress={() => setSingle('teamSize', opt)}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Step 3: Service location ── */}
        {step === 3 && (
          <>
            <Text style={s.stepLabel}>Business setup</Text>
            <Text style={s.question}>How do you{'\n'}serve your clients?</Text>
            <Text style={s.hint}>Select all that apply</Text>
            <View style={s.options}>
              {[
                'Clients visit my studio or salon',
                'I visit clients at their location',
                'I offer virtual or online services',
              ].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={answers.serviceLocation.includes(opt)}
                  onPress={() => toggleMulti('serviceLocation', opt)}
                  multi
                />
              ))}
            </View>
          </>
        )}

        {/* ── Step 4: How did you hear ── */}
        {step === 4 && (
          <>
            <Text style={s.stepLabel}>Almost done</Text>
            <Text style={s.question}>How did you hear{'\n'}about Scalio?</Text>
            <Text style={s.hint}>Helps us understand how businesses find us</Text>
            <View style={s.options}>
              {[
                'A friend or colleague',
                'Instagram or social media',
                'Google search',
                'Word of mouth',
                'Other',
              ].map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={answers.source === opt}
                  onPress={() => setSingle('source', opt)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <CTAButton
          label={isLast ? 'Done' : 'Continue'}
          onPress={() => {
            if (isLast) finish();
            else setStep((s) => s + 1);
          }}
          disabled={
            (step === 1 && answers.businessType.length === 0) ||
            (step === 2 && !answers.teamSize) ||
            (step === 3 && answers.serviceLocation.length === 0) ||
            (step === 4 && !answers.source)
          }
          icon={
            !isLast
              ? <Feather name="arrow-right" size={18} color="#fff" />
              : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Splash
  splashBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    lineHeight: 36,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
  splashSub: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  splashFooter: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  footerLink: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  footerDot: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
  },
  signInLink: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  signInLinkBold: {
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },

  // Q screens
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  saveExit: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stepLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  question: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: colors.text,
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 21,
  },
  options: {
    gap: spacing.md,
  },
  bottomBar: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
});
