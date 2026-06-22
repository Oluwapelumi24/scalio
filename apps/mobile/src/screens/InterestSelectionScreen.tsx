import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CATEGORY_META } from '../lib/categories';
import { INTERESTS, type Interest } from '../lib/interests';
import { setInterests } from '../lib/preferences';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestSelection'>;

const CIRCLE_SIZE = 84;

// ── Animated cell ────────────────────────────────────────────────────────────

function InterestCell({
  item,
  isSelected,
  onToggle,
  entryIndex,
}: {
  item: Interest;
  isSelected: boolean;
  onToggle: () => void;
  entryIndex: number;
}) {
  const meta = CATEGORY_META[item];
  const [imgError, setImgError] = useState(false);

  // Entrance: fade + rise
  const entryAnim = useRef(new Animated.Value(0)).current;
  // Press bounce: compress → spring back
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Ring scale when selection changes
  const ringAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 480,
      delay: Math.min(entryIndex * 45, 400),
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.spring(ringAnim, {
      toValue: isSelected ? 1 : 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 220,
      mass: 0.6,
    }).start();
  }, [isSelected, ringAnim]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.84,
        duration: 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 160,
        mass: 0.5,
      }),
    ]).start();
    onToggle();
  }

  const opacity = entryAnim;
  const translateY = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const ringOpacity = ringAnim;
  const overlayOpacity = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.32],
  });
  const checkScale = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <Animated.View style={[styles.cell, { opacity, transform: [{ translateY }] }]}>
      <Pressable onPress={handlePress}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {/* Outer ring (animated in on select) */}
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          {/* Circle with image */}
          <View style={styles.circle}>
            {imgError ? (
              <View style={[styles.circleImage, styles.circleFallback, { backgroundColor: meta.color }]}>
                <Feather name={meta.icon} size={28} color="#fff" />
              </View>
            ) : (
              <Image
                source={typeof meta.image === 'number' ? meta.image : { uri: meta.image }}
                style={styles.circleImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            )}

            {/* Dark overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />

            {/* Check badge */}
            <Animated.View
              style={[
                styles.checkBadge,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              <Feather name="check" size={15} color="#fff" />
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>

      <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
        {item}
      </Text>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function InterestSelectionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? INTERESTS.filter((i) => i.toLowerCase().includes(q)) : INTERESTS;
  }, [query]);

  function toggle(interest: string) {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    await setInterests(selected);
    navigation.navigate('LocationSetup');
  }

  const canContinue = selected.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you into?</Text>
          <Text style={styles.subtitle}>
            Pick your interests and we'll personalise your feed.
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <InterestCell
            item={item as Interest}
            isSelected={selected.includes(item)}
            onToggle={() => toggle(item)}
            entryIndex={index}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No categories match "{query}"</Text>
        }
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {selected.length > 0 && (
          <Text style={styles.countLabel}>{selected.length} selected</Text>
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
      </SafeAreaView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const RING_SIZE = CIRCLE_SIZE + 8;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.primary,
    padding: 0,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  cell: {
    alignItems: 'center',
    width: RING_SIZE + 8,
  },
  // Outer selection ring (sits behind the circle)
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: colors.primary,
    top: -(RING_SIZE - CIRCLE_SIZE) / 2,
    left: -(RING_SIZE - CIRCLE_SIZE) / 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  circleFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    textAlign: 'center',
    lineHeight: 17,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  countLabel: {
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
