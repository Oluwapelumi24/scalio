import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { setupProgress, useSetupStatus, type SetupState } from '../lib/setup';
import { getSession } from '../lib/session';
import { GUTTER, makeStyles, useTheme } from '../theme';

/** Full-width navy bar across the top until the business can take bookings. */
export function ContinueSetupBar({ topInset, setup }: { topInset: number; setup: SetupState }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { done, total, left, next } = setupProgress(setup);
  return (
    <Pressable
      onPress={() => navigation.navigate('Setup')}
      accessibilityRole="button"
      accessibilityLabel={`Continue setup. ${left} of ${total} steps left${next ? `. Next: ${next}` : ''}`}
      style={({ pressed }) => [styles.bar, { paddingTop: topInset + 12 }, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.barIcon}>
        <Feather name="zap" size={18} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.barText}>Continue setup</Text>
        {next ? <Text style={styles.barSub} numberOfLines={1}>Next: {next}</Text> : null}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(done / total) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{left} left</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.onAccent} />
    </Pressable>
  );
}

/**
 * The frame for tab screens: the set-up bar when it's needed (owners and
 * managers only), otherwise just the safe-area space at the top.
 */
export function TabFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const setup = useSetupStatus();
  const role = getSession()?.role;
  const showBar = !!setup && !setup.ready && (role === 'owner' || role === 'manager');
  const focused = useIsFocused();
  return (
    <View style={styles.root}>
      {/* Light clock and battery on the navy bar; the app-wide bar takes over again elsewhere */}
      {showBar && focused ? <StatusBar style="light" /> : null}
      {showBar && setup ? <ContinueSetupBar topInset={insets.top} setup={setup} /> : <View style={{ height: insets.top }} />}
      {children}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.accent, paddingHorizontal: GUTTER, paddingBottom: 14,
  },
  barIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  barText: { fontSize: 15, fontWeight: '600', color: colors.onAccent },
  barSub: { fontSize: 12, lineHeight: 16, color: colors.onAccent, opacity: 0.75, marginTop: 1 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 8, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.onAccent },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.onAccent },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.accent },
}));
