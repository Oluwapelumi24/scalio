import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CATEGORY_META } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { setHasSeenOnboarding, setInterests } from '../lib/preferences';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestSelection'>;

export function InterestSelectionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? INTERESTS.filter((i) => i.toLowerCase().includes(q)) : INTERESTS;
  }, [query]);

  function toggle(interest: string) {
    setSelected((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    await setInterests(selected);
    await setHasSeenOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  const canContinue = selected.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Select your interests and we'll personalise your recommendations. Pick at least one.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item);
          const meta = CATEGORY_META[item as keyof typeof CATEGORY_META];
          return (
            <Pressable
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggle(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? '#ffffff33' : `${meta?.color ?? '#999'}22` }]}>
                <Feather
                  name={meta?.icon ?? 'grid'}
                  size={22}
                  color={isSelected ? '#ffffff' : (meta?.color ?? colors.textMuted)}
                />
              </View>
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]} numberOfLines={2}>
                {item}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Feather name="check" size={12} color="#ffffff" />
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No categories match "{query}"</Text>
        }
      />

      <View style={styles.footer}>
        {selected.length > 0 && (
          <Text style={styles.selectionCount}>{selected.length} selected</Text>
        )}
        <Pressable
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => void handleContinue()}
          disabled={!canContinue}
        >
          <Text style={styles.ctaLabel}>
            {canContinue ? 'Continue' : 'Select at least one'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxxl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: typography.size.base,
    color: colors.primary,
  },
  grid: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    minHeight: 110,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    lineHeight: 20,
  },
  cardLabelSelected: {
    color: '#ffffff',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  selectionCount: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
});
