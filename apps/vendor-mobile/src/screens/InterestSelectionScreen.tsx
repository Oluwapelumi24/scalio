import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getInterestGroups, getPreferences, updatePreferences, type InterestGroup } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestSelection'>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

function InterestCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
          <Feather name={icon as FeatherName} size={18} color={selected ? colors.white : colors.accent} />
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected && <Feather name="check" size={12} color={colors.white} />}
        </View>
      </View>
      <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function InterestSelectionScreen({ navigation, route }: Props) {
  const fromSettings = route.params?.fromSettings ?? false;
  const [groups, setGroups] = useState<InterestGroup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [g, prefs] = await Promise.all([getInterestGroups(), getPreferences()]);
      setGroups(g);
      setSelected(prefs.interests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function leave() {
    if (fromSettings) navigation.goBack();
    else navigation.replace('Main');
  }

  async function save(interests: string[]) {
    setSaving(true);
    setError('');
    try {
      await updatePreferences({ interests, completeInterests: true });
      leave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your choices. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topNav}>
        {fromSettings ? (
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View />
        )}
        {!fromSettings && (
          // Skipping still marks the screen as done, so it isn't shown again; the
          // home screen simply uses the defaults.
          <Pressable onPress={() => save(selected)} hitSlop={12} disabled={saving} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">What do you want help with?</Text>
        <Text style={styles.subtitle}>
          Choose what matters most to your business. We'll set up Scalio to help you get things done.
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing.xxxl }} color={colors.accent} />
        ) : groups.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Nothing to show yet.'}</Text>
            <Pressable onPress={load} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.grid}>
                {group.interests.map((interest) => (
                  <InterestCard
                    key={interest.id}
                    label={interest.label}
                    icon={interest.icon}
                    selected={selected.includes(interest.id)}
                    onPress={() => toggle(interest.id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {error && groups.length > 0 ? <Text style={styles.footerError}>{error}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.cta, (saving || loading) && styles.ctaDisabled, pressed && { opacity: 0.88 }]}
          onPress={() => save(selected)}
          disabled={saving || loading || groups.length === 0}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaLabel}>
              {selected.length > 0 ? `Continue (${selected.length})` : 'Continue'}
            </Text>
          )}
        </Pressable>
        <Text style={styles.footnote}>You can change these choices anytime in Settings.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    lineHeight: 36,
    marginTop: spacing.sm,
  },
  subtitle: { fontSize: typography.size.base, color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  group: { marginTop: spacing.xl },
  groupTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    width: '47.5%',
    minHeight: 112,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: '#eef2ff' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: { backgroundColor: colors.accent },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  cardLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text,
    marginTop: spacing.md,
    lineHeight: 19,
  },
  cardLabelSelected: { color: colors.accent, fontWeight: typography.weight.semibold },
  errorBox: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.md },
  errorText: { fontSize: typography.size.base, color: colors.textMuted, textAlign: 'center' },
  retry: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  retryText: { color: colors.accent, fontWeight: typography.weight.semibold },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  footerError: { color: colors.error, fontSize: typography.size.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.pill,
    marginHorizontal: spacing.xl,
  },
  ctaDisabled: { backgroundColor: colors.disabled },
  ctaLabel: { color: colors.white, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  footnote: { fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center' },
});
