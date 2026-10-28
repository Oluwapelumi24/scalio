import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingSuccess'>;

// The celebration screen keeps its own navy gradient in both themes; only the
// main button changes: white on light, bright navy on dark.
const GRADIENT = ['#0a1230', '#1e3a8a', '#0d1840'] as const;
const ON_NAVY = '#ffffff';
const ON_NAVY_MUTED = 'rgba(255,255,255,0.72)';
const ON_NAVY_FAINT = 'rgba(255,255,255,0.5)';
const ON_NAVY_LINE = 'rgba(255,255,255,0.28)';

export function BookingSuccessScreen({ route, navigation }: Props) {
  const { booking, vendor } = route.params;
  const { scheme } = useTheme();
  const styles = useStyles();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const dark = scheme === 'dark';

  return (
    <LinearGradient colors={GRADIENT} locations={[0, 0.55, 1]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.checkCircle}>
            <Feather name="check" size={40} color={ON_NAVY} />
          </View>

          <Text style={styles.headline} accessibilityRole="header">Appointment{'\n'}booked!</Text>
          <Text style={styles.sub}>
            Your appointment at <Text style={styles.subBold}>{vendor.businessName}</Text> has been confirmed. We’ll
            send a reminder before your visit.
          </Text>

          <View style={styles.refBadge}>
            <Text style={styles.refLabel}>Booking reference</Text>
            <Text style={styles.refValue}>{booking.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('Main', { screen: 'Appointments' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, dark ? styles.ctaDark : styles.ctaLight, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.ctaLabel, dark ? styles.ctaLabelDark : styles.ctaLabelLight]}>View my bookings</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.secondary}
          >
            <Text style={styles.secondaryLabel}>Continue exploring</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: GUTTER, paddingBottom: spacing.lg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  headline: { fontSize: 26, lineHeight: 31, fontWeight: '700', letterSpacing: -0.5, color: ON_NAVY, textAlign: 'center', marginBottom: spacing.lg },
  sub: { fontSize: 15, lineHeight: 21, color: ON_NAVY_MUTED, textAlign: 'center', marginBottom: spacing.xxl },
  subBold: { color: ON_NAVY, fontWeight: '600' },
  refBadge: { borderWidth: 1, borderColor: ON_NAVY_LINE, borderRadius: 14, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center', gap: 4 },
  refLabel: { fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: ON_NAVY_FAINT },
  refValue: { fontSize: 17, fontWeight: '700', letterSpacing: 3, color: ON_NAVY, fontVariant: ['tabular-nums'] },
  actions: { gap: spacing.md },
  cta: { minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  ctaLight: { backgroundColor: ON_NAVY },
  ctaDark: { backgroundColor: colors.accent },
  ctaLabel: { fontSize: 15, fontWeight: '700' },
  ctaLabelLight: { color: '#1e3a8a' },
  ctaLabelDark: { color: colors.onAccent },
  secondary: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryLabel: { fontSize: 14, fontWeight: '600', color: ON_NAVY_MUTED },
}));
