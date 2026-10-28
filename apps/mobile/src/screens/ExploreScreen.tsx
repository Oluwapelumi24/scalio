import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageSource } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { EmptyState, PageHeader, SectionTitle } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

type Props = MainTabScreenProps<'Explore'>;

interface CategorySection {
  category: string;
  vendors: Vendor[];
}

export function ExploreScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.category}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <PageHeader title="Explore" description="Browse businesses near you by category." />
            {error ? <EmptyState icon="wifi-off" title="Couldn’t load businesses" body={error} /> : null}
            {!error && !vendors ? <ActivityIndicator color={colors.link} style={{ marginTop: spacing.xl }} /> : null}
            {!error && vendors && sections.length === 0 ? (
              <EmptyState icon="compass" title="Nothing to explore yet" body="Check back soon for new businesses." />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.section}>
            <SectionTitle title={item.category} />
            <FlatList
              horizontal
              data={item.vendors}
              keyExtractor={(vendor) => vendor.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              style={{ marginHorizontal: -GUTTER }}
              renderItem={({ item: vendor }) => (
                <Pressable
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                  onPress={() => openVendor(vendor)}
                  accessibilityRole="button"
                  accessibilityLabel={vendor.businessName}
                >
                  <View>
                    <Image source={getVendorImageSource(vendor)} style={styles.cardImage} />
                    <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
                      <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
                    </View>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{vendor.businessName}</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: GUTTER, paddingBottom: 48, gap: 28 },
  section: { gap: spacing.md },
  row: { paddingHorizontal: GUTTER, gap: 14 },
  card: { width: 150, gap: spacing.sm },
  cardImage: { width: 150, height: 110, borderRadius: 18, backgroundColor: colors.surface },
  categoryBadge: {
    position: 'absolute', right: spacing.sm, bottom: spacing.sm, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
}));
