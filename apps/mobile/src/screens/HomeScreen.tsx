import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl, CATEGORY_META } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = MainTabScreenProps<'Home'>;

const DISPLAY_CATEGORIES = INTERESTS.slice(0, 8);

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <View style={styles.ratingRow}>
      <Feather name="star" size={12} color="#F5A623" />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function FeaturedCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.featuredCard} onPress={onPress}>
      <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <View style={[styles.categoryChip, { backgroundColor: getVendorAccentColor(vendor) }]}>
          <Text style={styles.categoryChipText}>{vendor.category}</Text>
        </View>
        <Text style={styles.featuredName} numberOfLines={1}>{vendor.businessName}</Text>
        {vendor.address ? (
          <View style={styles.featuredAddressRow}>
            <Feather name="map-pin" size={10} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredAddress} numberOfLines={1}>{vendor.address}</Text>
          </View>
        ) : null}
        <StarRating rating={vendor.rating} />
      </View>
    </Pressable>
  );
}

function BusinessCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.businessCard} onPress={onPress}>
      <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.businessImage} />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={1}>{vendor.businessName}</Text>
        <Text style={styles.businessCategory}>{vendor.category}</Text>
        {vendor.address ? (
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={11} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>{vendor.address}</Text>
          </View>
        ) : null}
        {vendor.rating ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color="#F5A623" />
            <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
            {vendor.reviewCount ? (
              <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function CategoryCard({ category, onPress }: { category: string; onPress: () => void }) {
  const meta = CATEGORY_META[category as keyof typeof CATEGORY_META];
  return (
    <Pressable style={styles.categoryCard} onPress={onPress}>
      <View style={[styles.categoryIconWrap, { backgroundColor: `${meta?.color ?? '#999'}18` }]}>
        <Feather name={meta?.icon ?? 'grid'} size={24} color={meta?.color ?? colors.textMuted} />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={2}>{category}</Text>
    </Pressable>
  );
}

export function HomeScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    let cancelled = false;
    listVendors()
      .then((result) => { if (!cancelled) setVendors(result); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load businesses.');
      });
    return () => { cancelled = true; };
  }, []);

  const featured = useMemo(() => (vendors ?? []).filter((v) => v.featured), [vendors]);

  const recommended = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return vendors ?? [];
    return (vendors ?? []).filter((v) => v.businessName.toLowerCase().includes(trimmed));
  }, [vendors, query]);

  function openVendor(vendor: Vendor) {
    navigation.navigate('VendorProfile', { vendor });
  }

  const greeting = user ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Hey there 👋';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Pressable style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={colors.primary} />
              <Text style={styles.locationText}>Set your location</Text>
              <Feather name="chevron-down" size={13} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn}>
              <Feather name="bell" size={20} color={colors.primary} />
            </Pressable>
            {user ? (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <Pressable
                style={styles.signInBtn}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.signInBtnLabel}>Sign in</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search salons, spas, barbers, nail technicians..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search results */}
      {query.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          {!vendors && <ActivityIndicator style={{ marginTop: spacing.md }} />}
          {vendors && recommended.length === 0 && (
            <Text style={styles.emptyText}>No businesses match "{query}"</Text>
          )}
          {recommended.map((vendor) => (
            <BusinessCard key={vendor.id} vendor={vendor} onPress={() => openVendor(vendor)} />
          ))}
        </View>
      )}

      {query.length === 0 && (
        <>
          {/* Featured / Recommended */}
          {(featured.length > 0 || !vendors) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended for you</Text>
              </View>
              {!vendors && <ActivityIndicator style={{ marginTop: spacing.md }} />}
              {error && <Text style={styles.errorText}>{error}</Text>}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {featured.map((vendor) => (
                  <FeaturedCard key={vendor.id} vendor={vendor} onPress={() => openVendor(vendor)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Browse by category</Text>
              <Pressable>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.categoryGrid}>
              {DISPLAY_CATEGORIES.map((category) => (
                <CategoryCard key={category} category={category} onPress={() => {}} />
              ))}
            </View>
          </View>

          {/* All businesses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All businesses</Text>
            {!vendors && <ActivityIndicator style={{ marginTop: spacing.md }} />}
            {error && <Text style={styles.errorText}>{error}</Text>}
            {vendors && vendors.length === 0 && (
              <Text style={styles.emptyText}>No businesses yet — check back soon.</Text>
            )}
            {(vendors ?? []).map((vendor) => (
              <BusinessCard key={vendor.id} vendor={vendor} onPress={() => openVendor(vendor)} />
            ))}
          </View>
        </>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: typography.weight.bold,
  },
  signInBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  signInBtnLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  searchIcon: {},
  search: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.primary,
    padding: 0,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  horizontalScroll: {
    paddingBottom: 4,
  },
  featuredCard: {
    width: 240,
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'transparent',
    // gradient-like fade using a semi-transparent dark gradient
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  categoryChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: '#ffffff',
  },
  featuredName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
  },
  featuredAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  featuredAddress: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '22%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    textAlign: 'center',
    lineHeight: 15,
  },
  businessCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  businessImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.border,
  },
  businessInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 3,
  },
  businessName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  businessCategory: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addressText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
  },
  reviewCount: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.base,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.size.base,
  },
});
