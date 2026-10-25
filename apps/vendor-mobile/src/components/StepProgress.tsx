import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * The progress bar across the top of a multi-step flow: a filling bar with a
 * moving sheen, a counted percentage, and a dot per step that fills and ticks
 * as each one is done. Finished steps can be tapped to go back.
 */
export function StepProgress({ steps, current, onStepPress }: { steps: string[]; current: number; onStepPress?: (index: number) => void }) {
  const s = useSStyles();
  const { colors } = useTheme();
  const target = steps.length <= 1 ? 1 : (current + 1) / steps.length;
  const fill = useRef(new Animated.Value(target)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const [percent, setPercent] = useState(Math.round(target * 100));

  // The bar springs to the new step; the number counts along with it.
  useEffect(() => {
    Animated.spring(fill, { toValue: target, useNativeDriver: false, damping: 18, stiffness: 140, mass: 0.8 }).start();
  }, [target, fill]);
  useEffect(() => {
    const id = fill.addListener(({ value }) => setPercent(Math.round(Math.min(1, Math.max(0, value)) * 100)));
    return () => fill.removeListener(id);
  }, [fill]);

  // A soft highlight sweeps across the filled part every couple of seconds.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheen, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sheen]);

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-80, Math.max(trackWidth, 80)] });

  return (
    <View style={s.root} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: steps.length, now: current + 1, text: `Step ${current + 1} of ${steps.length}: ${steps[current]}` }}>
      <View style={s.topRow}>
        <Text style={s.counter}>Step {current + 1} of {steps.length}</Text>
        <Text style={s.percent}>{percent}%</Text>
      </View>
      <Text style={s.current}>{steps[current]}</Text>

      <View style={s.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[s.fillWrap, { width }]}>
          <LinearGradient colors={[colors.accent, '#3b5bdb', colors.success]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <AnimatedGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.sheen, { transform: [{ translateX: sheenX }] }]}
          />
        </Animated.View>
      </View>

      <View style={s.dots}>
        {steps.map((label, i) => (
          <StepDot key={label} label={label} state={i < current ? 'done' : i === current ? 'current' : 'todo'} onPress={i < current && onStepPress ? () => onStepPress(i) : undefined} />
        ))}
      </View>
    </View>
  );
}

function StepDot({ label, state, onPress }: { label: string; state: 'done' | 'current' | 'todo'; onPress?: () => void }) {
  const s = useSStyles();
  const { colors } = useTheme();
  const pop = useRef(new Animated.Value(state === 'todo' ? 0 : 1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: state === 'todo' ? 0 : 1, useNativeDriver: true, damping: 10, stiffness: 220, mass: 0.6 }).start();
  }, [state, pop]);

  // The current step breathes gently so it's obvious where you are.
  useEffect(() => {
    if (state !== 'current') { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={s.dotCell} hitSlop={6} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? `Back to ${label}` : undefined}>
      <View style={s.dotBox}>
        {state === 'current' && (
          <Animated.View style={[s.halo, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }]} />
        )}
        <View style={[s.dot, state === 'todo' && s.dotTodo]}>
          <Animated.View style={[StyleSheet.absoluteFill, s.dotFill, state === 'current' && s.dotCurrent, { transform: [{ scale }], opacity: pop }]}>
            {state === 'done' && <Feather name="check" size={11} color={colors.white} />}
          </Animated.View>
        </View>
      </View>
      <Text numberOfLines={1} style={[s.dotLabel, state === 'current' && s.dotLabelCurrent, state === 'done' && s.dotLabelDone]}>{label}</Text>
    </Pressable>
  );
}

const DOT = 18;

const useSStyles = makeStyles((colors) => ({
  root: { gap: spacing.xs },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  counter: { fontSize: typography.size.xs, fontWeight: typography.weight.regular, color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' },
  percent: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.accent, fontVariant: ['tabular-nums'] },
  current: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.mist, overflow: 'hidden', marginTop: spacing.xs },
  fillWrap: { height: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  dots: { flexDirection: 'row', marginTop: spacing.sm },
  dotCell: { flex: 1, alignItems: 'center', gap: 4 },
  dotBox: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.accent },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, overflow: 'hidden', backgroundColor: colors.mist },
  dotTodo: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  dotFill: { backgroundColor: colors.success, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  dotCurrent: { backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.accentLight },
  dotLabel: { fontSize: 10, color: colors.textMuted },
  dotLabelCurrent: { color: colors.accent, fontWeight: typography.weight.medium },
  dotLabelDone: { color: colors.text },
}));
