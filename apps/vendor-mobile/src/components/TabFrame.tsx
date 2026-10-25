import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { useSetupStatus } from '../lib/setup';
import { getSession } from '../lib/session';
import { GUTTER, makeStyles, useTheme } from '../theme';

/** Full-width navy bar across the top until the business can take bookings. */
export function ContinueSetupBar({ topInset }: { topInset: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Setup')}
      accessibilityRole="button"
      accessibilityLabel="Continue setup"
      style={({ pressed }) => [styles.bar, { paddingTop: topInset + 12 }, pressed && { opacity: 0.9 }]}
    >
      <Feather name="zap" size={22} color={colors.onAccent} />
      <Text style={styles.barText}>Continue setup</Text>
      <Feather name="chevron-right" size={22} color={colors.onAccent} />
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
      {showBar ? <ContinueSetupBar topInset={insets.top} /> : <View style={{ height: insets.top }} />}
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
  barText: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.onAccent },
}));
