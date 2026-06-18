import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { CATEGORY_META, getVendorImageUrl } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = MainTabScreenProps<'Home'>;

const CARD_WIDTH = 168;
const CARD_IMAGE_HEIGHT = 120;

function shortAddress(address: string): string {
  const parts = address.split(',').map((s) => s.trim());
  return parts.length >= 2 ? parts.slice(-2).join(', ') : address;
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{vendor.businessName}</Text>
        {(vendor.rating != null || vendor.reviewCount != null) && (
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color="#F5A623" />
            {vendor.rating != null && (
              <Text style={styles.ratingValue}>{vendor.rating.toFixed(1)}</Text>
            )}
            {vendor.reviewCount != null && (
              <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
            )}
          </View>
        )}
        {vendor.address ? (
          <Text style={styles.cardAddress} numberOfLines={1}>{shortAddress(vendor.address)}</Text>
        ) : null}
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{vendor.category}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryChips({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {INTERESTS.map((category) => {
        const meta = CATEGORY_META[category as keyof typeof CATEGORY_META];
        return (
          <Pressable key={category} style={styles.categoryChip} onPress={() => onSelect(category)}>
            <View style={styles.categoryIconWrap}>
              <Feather name={meta.icon} size={20} color={colors.textBody} />
            </View>
            <Text style={styles.categoryChipLabel} numberOfLines={1}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SectionRow({
  title,
  vendors,
  onPress,
  loading,
}: {
  title: string;
  vendors: Vendor[];
  onPress: (v: Vendor) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onPress={() => onPress(vendor)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const recommended = useMemo(() => (vendors ?? []).filter((v) => v.featured), [vendors]);
  const rest = useMemo(() => (vendors ?? []).filter((v) => !v.featured), [vendors]);

  function openVendor(vendor: Vendor) {
    navigation.navigate('VendorProfile', { vendor });
  }

  const firstName = user?.name.split(' ')[0] ?? null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey{firstName ? `, ${firstName}` : ' there'}</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}>
            <Feather name="bell" size={20} color={colors.primary} />
          </Pressable>
          {user ? (
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
          ) : (
            <Pressable style={styles.signInBtn} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signInLabel}>Sign in</Text>
            </Pressable>
          )}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <CategoryChips onSelect={() => {}} />

      <SectionRow
        title="Recommended"
        vendors={recommended}
        onPress={openVendor}
        loading={vendors === null && !error}
      />

      {(vendors === null || rest.length > 0) && (
        <SectionRow
          title="New to Scalio"
          vendors={rest}
          onPress={openVendor}
          loading={vendors === null && !error}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 96,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  greeting: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  headerRight: {
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
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  signInBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  signInLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  categoryScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  loader: {
    marginLeft: spacing.xl,
  },
  cardScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: colors.border,
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
  },
  reviewCount: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  cardAddress: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#f3f3f3',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
});
