import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  getHome,
  getPreferences,
  resetHome,
  updatePreferences,
  type HomeLayer,
  type Preferences,
} from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomiseHome'>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface Row { id: string; layer: HomeLayer; title: string; icon: string }

const LAYER_TITLES: Partial<Record<HomeLayer, string>> = {
  overview: 'Business overview',
  quick_action: 'Quick actions',
  recommendation: 'Suggestions',
};

/**
 * Pin a module to the top of its section or hide it. Alerts can't be hidden, and
 * hidden modules stay listed here so nothing is ever lost.
 */
export function CustomiseHomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [rows, setRows] = useState<Row[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [home, p] = await Promise.all([getHome(), getPreferences()]);
      const visible = (['overview', 'quick_action', 'recommendation'] as const).flatMap((l) => home.layers[l]);
      setRows([...visible, ...home.hidden].map(({ id, layer, title, icon }) => ({ id, layer, title, icon })));
      setPrefs(p);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your home settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function apply(change: Parameters<typeof updatePreferences>[0]) {
    try {
      setPrefs(await updatePreferences(change));
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  function togglePin(id: string) {
    if (!prefs) return;
    const pinned = prefs.pinnedModules.includes(id)
      ? prefs.pinnedModules.filter((m) => m !== id)
      : [...prefs.pinnedModules, id];
    void apply({ pinnedModules: pinned });
  }

  function toggleHidden(id: string) {
    if (!prefs) return;
    const hidden = prefs.hiddenModules.includes(id)
      ? prefs.hiddenModules.filter((m) => m !== id)
      : [...prefs.hiddenModules, id];
    void apply({ hiddenModules: hidden });
  }

  function confirmReset() {
    Alert.alert('Reset home screen?', 'Pins, hidden items and learned order will be cleared. Your interests stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            setPrefs(await resetHome());
          } catch (err) {
            Alert.alert('Could not reset', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topNav}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Customise home</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxxl }} color={colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>
            Pin what you use most to the top. Hidden items stay available in the menus. Alerts that need your attention always show.
          </Text>

          {(Object.keys(LAYER_TITLES) as HomeLayer[]).map((layer) => {
            const items = rows.filter((r) => r.layer === layer);
            if (items.length === 0) return null;
            return (
              <View key={layer} style={styles.group}>
                <Text style={styles.groupTitle}>{LAYER_TITLES[layer]}</Text>
                <View style={styles.card}>
                  {items.map((row, i) => {
                    const pinned = prefs?.pinnedModules.includes(row.id) ?? false;
                    const hidden = prefs?.hiddenModules.includes(row.id) ?? false;
                    return (
                      <View key={row.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                        <Feather name={row.icon as FeatherName} size={18} color={hidden ? colors.disabled : colors.textSecondary} />
                        <Text style={[styles.rowLabel, hidden && styles.rowLabelHidden]} numberOfLines={1}>{row.title}</Text>
                        <Pressable
                          onPress={() => togglePin(row.id)}
                          hitSlop={8}
                          style={[styles.chip, pinned && styles.chipOn]}
                          accessibilityRole="button"
                          accessibilityLabel={`${pinned ? 'Unpin' : 'Pin'} ${row.title}`}
                        >
                          <Text style={[styles.chipText, pinned && styles.chipTextOn]}>{pinned ? 'Pinned' : 'Pin'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => toggleHidden(row.id)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`${hidden ? 'Show' : 'Hide'} ${row.title}`}
                        >
                          <Feather name={hidden ? 'eye-off' : 'eye'} size={18} color={hidden ? colors.textMuted : colors.accent} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <Pressable style={styles.link} onPress={() => navigation.navigate('InterestSelection', { fromSettings: true })}>
            <Feather name="sliders" size={16} color={colors.accent} />
            <Text style={styles.linkText}>Change what you want help with</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={confirmReset}>
            <Feather name="rotate-ccw" size={16} color={colors.error} />
            <Text style={[styles.linkText, { color: colors.error }]}>Reset home screen</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  hint: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  error: { margin: spacing.xl, color: colors.error, textAlign: 'center' },
  group: { marginTop: spacing.xl },
  groupTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  card: { backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontSize: typography.size.base, color: colors.text },
  rowLabelHidden: { color: colors.textMuted },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  linkText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.accent },
}));
