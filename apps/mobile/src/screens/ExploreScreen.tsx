import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { colors, radius, spacing, typography } from '../theme';

type Props = MainTabScreenProps<'Explore'>;

interface CategorySection {
  category: string;
  vendors: Vendor[];
}

export function ExploreScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listVendors()
      .then((result) => {
        if (!cancelled) setVendors(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load businesses.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo<CategorySection[]>(() => {
    if (!vendors) return [];
    return INTERESTS.map((category) => ({
      category,
      vendors: vendors.filter((vendor) => vendor.category.toLowerCase() === category.toLowerCase()),
    })).filter((section) => section.vendors.length > 0);
  }, [vendors]);

  function openVendor(vendor: Vendor) {
    navigation.navigate('ServiceSelection', { vendor });
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Explore by category</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            {!error && !vendors && <ActivityIndicator style={styles.loader} />}
            {!error && vendors && sections.length === 0 && (
              <Text style={styles.empty}>No businesses to explore yet — check back soon.</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{item.category}</Text>
            <FlatList
              horizontal
              data={item.vendors}
              keyExtractor={(vendor) => vendor.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              renderItem={({ item: vendor }) => (
                <Pressable style={styles.card} onPress={() => openVendor(vendor)}>
                  <View style={styles.cardImageWrap}>
                    <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.cardImage} />
                    <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
                      <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {vendor.businessName}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.error,
    fontSize: typography.size.base,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.size.base,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  row: {
    paddingBottom: 4,
  },
  card: {
    width: 140,
    marginRight: 14,
  },
  cardImageWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  cardImage: {
    width: 140,
    height: 100,
    borderRadius: radius.xl,
    backgroundColor: colors.border,
  },
  categoryBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
});
