import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Button, type FeatherName } from '../components/ui';
import { markOnboardingSeen } from '../lib/preferences';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDE_MS = 5000;

type Art = 'calendar' | 'booking' | 'tools' | 'payments';

// Bookings first, then what's there when the business is ready for more.
const SLIDES: { title: string; body: string; art: Art }[] = [
  { title: 'Your bookings, all in one place', body: 'See your day at a glance, for you and every member of your team.', art: 'calendar' },
  { title: 'Let clients book themselves', body: 'Share one link. Clients pick a service and a free time, day or night.', art: 'booking' },
  { title: 'Tools to grow when you’re ready', body: 'Posts, ads, follow-ups and payroll wait in More until you want them.', art: 'tools' },
  { title: 'Get paid with less stress', body: 'Take deposits online and see every payment in one place.', art: 'payments' },
];

/** Story-style intro: segments fill across the top and the slides move on by themselves. */
export function OnboardingScreen({ navigation }: Props) {
  const styles = useStyles();
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const run = Animated.timing(progress, { toValue: 1, duration: SLIDE_MS, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => {
      if (finished) setIndex((i) => (i + 1) % SLIDES.length);
    });
    return () => run.stop();
  }, [index, progress]);

  async function start() {
    await markOnboardingSeen();
    navigation.replace('Register');
  }

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

      {/* Tap the left or right half to go back or forward */}
      <View style={styles.stage}>
        <View style={styles.slide} pointerEvents="none">
          <Illustration art={slide.art} />
          <View style={{ gap: 10 }}>
            <Text style={styles.title} accessibilityRole="header">{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        </View>
        <Pressable style={styles.half} onPress={() => setIndex(Math.max(0, index - 1))} accessibilityLabel="Previous slide" />
        <Pressable style={styles.half} onPress={() => setIndex((index + 1) % SLIDES.length)} accessibilityLabel="Next slide" />
      </View>

      <View style={styles.footer}>
        <Button label="Get started" onPress={() => void start()} />
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8} accessibilityRole="button">
          <Text style={styles.signIn}>I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** A floating white card with coloured chips: a small picture of each idea. Same in light and dark. */
function Illustration({ art }: { art: Art }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const chip = (icon: FeatherName, bg: string, pos: object, size = 56) => (
    <View style={[styles.bubble, { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 }, pos]}>
      <Feather name={icon} size={size * 0.42} color="#ffffff" />
    </View>
  );
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.card}>
        {art === 'calendar' ? (
          <>
            {['10:00', '11:00', '12:00', '13:00', '14:00'].map((t, i) => (
              <View key={t} style={[styles.gridLine, { top: 34 + i * 36 }]}>
                <Text style={styles.gridTime}>{t}</Text>
              </View>
            ))}
            <View style={[styles.appt, { top: 52, left: -24, backgroundColor: '#e8edfa', borderColor: '#9fb3ec' }]}>
              <Text style={styles.apptTime}>10:30, Sat 18 Oct</Text>
              <Text style={styles.apptName}>Haircut</Text>
            </View>
            <View style={[styles.appt, { top: 140, left: 84, backgroundColor: '#e3f6e8', borderColor: '#93d3a6' }]}>
              <Text style={styles.apptTime}>13:00, Sat 18 Oct</Text>
              <Text style={styles.apptName}>Box braids</Text>
            </View>
          </>
        ) : art === 'booking' ? (
          <>
            <View style={styles.photo}>
              <Feather name="scissors" size={40} color="#1e3a8a" />
            </View>
            <Text style={styles.shop}>Fade House, Yaba</Text>
            <View style={styles.skeleton} />
            <View style={[styles.skeleton, { width: '55%' }]} />
            <View style={styles.bookNow}><Text style={styles.bookNowText}>Book now</Text></View>
            <View style={styles.rating}>
              <Feather name="star" size={20} color="#f5b100" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </>
        ) : art === 'tools' ? (
          <>
            <View style={[styles.skeleton, { marginTop: 18, width: '50%', alignSelf: 'center' }]} />
            {[0, 1, 2].map((i) => <View key={i} style={styles.slab} />)}
          </>
        ) : (
          <>
            <View style={[styles.skeleton, { marginTop: 18, width: '50%' }]} />
            {[['**** 1234', 'Card'], ['Transfer', 'Paystack']].map(([a, b], i) => (
              <View key={a} style={styles.payRow}>
                <View style={[styles.radio, i === 0 && styles.radioOn]} />
                <Text style={styles.payText}>{a}</Text>
                <Text style={styles.payBrand}>{b}</Text>
              </View>
            ))}
            <View style={[styles.slab, { marginTop: 14 }]} />
          </>
        )}
      </View>
      {art === 'tools' ? (
        <>
          {chip('trending-up', colors.accent, { left: 8, top: 40 })}
          {chip('image', '#15803d', { right: 6, top: 64 })}
          {chip('credit-card', '#c2410c', { left: '42%', top: 104 }, 68)}
          {chip('bar-chart-2', '#0e7490', { left: '38%', bottom: -6 })}
        </>
      ) : art === 'payments' ? (
        <>
          {chip('shield', '#15803d', { left: 4, top: -6 }, 64)}
          {chip('smartphone', colors.accent, { right: 4, bottom: 6 }, 72)}
        </>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  segments: { flexDirection: 'row', gap: 6, paddingHorizontal: GUTTER, paddingTop: 12 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  segmentFill: { height: 3, backgroundColor: colors.accent },
  stage: { flex: 1, flexDirection: 'row' },
  half: { flex: 1 },
  slide: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 44, paddingHorizontal: GUTTER },
  title: { fontSize: 21, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.text, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: GUTTER, paddingBottom: 12, gap: 20 },
  signIn: { fontSize: 14, fontWeight: '600', color: colors.link, textAlign: 'center' },

  art: { width: 300, height: 260, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: 200, height: 220, borderRadius: 28, backgroundColor: '#ffffff', padding: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6,
  },
  bubble: { position: 'absolute', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  gridLine: { position: 'absolute', left: 16, right: 0, height: 1, backgroundColor: '#eceef2' },
  gridTime: { position: 'absolute', top: -8, left: 0, fontSize: 10, color: '#9aa0aa' },
  appt: { position: 'absolute', width: 150, borderRadius: 12, borderWidth: 1.5, padding: 10 },
  apptTime: { fontSize: 12, fontWeight: '600', color: '#0a0a0a' },
  apptName: { fontSize: 12, color: '#3a3d44', marginTop: 2 },
  photo: { height: 84, borderRadius: 14, backgroundColor: '#e8edfa', alignItems: 'center', justifyContent: 'center' },
  shop: { fontSize: 13, fontWeight: '600', color: '#0a0a0a', textAlign: 'center', marginTop: 10 },
  skeleton: { height: 8, borderRadius: 4, backgroundColor: '#e6e8ec', marginTop: 8, width: '80%', alignSelf: 'center' },
  bookNow: { position: 'absolute', bottom: -14, left: 50, right: 50, height: 32, borderRadius: 8, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center' },
  bookNowText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  rating: {
    position: 'absolute', right: -40, top: 30, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  ratingText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  slab: { height: 36, borderRadius: 10, backgroundColor: '#eceef2', marginTop: 12 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#c4c7cc' },
  radioOn: { borderColor: '#1e3a8a', borderWidth: 5 },
  payText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0a0a0a' },
  payBrand: { fontSize: 11, fontWeight: '700', color: '#1e3a8a' },
}));
