import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Vendor } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listVendors } from '../lib/api';
import { INTERESTS } from '../lib/interests';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ALL_CATEGORIES_FILTER = 'All';
const CATEGORY_FILTERS = [ALL_CATEGORIES_FILTER, ...INTERESTS];

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.logoPlaceholder}>
        <Text style={styles.logoInitial}>{vendor.businessName.charAt(0)}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{vendor.businessName}</Text>
        <Text style={styles.cardSubtitle}>{vendor.category}</Text>
      </View>
    </Pressable>
  );
}

export function HomeScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_FILTER);

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

  const featured = useMemo(() => (vendors ?? []).filter((vendor) => vendor.featured), [vendors]);

  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return (vendors ?? []).filter((vendor) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORIES_FILTER ||
        vendor.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesQuery =
        trimmedQuery.length === 0 || vendor.businessName.toLowerCase().includes(trimmedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [vendors, query, activeCategory]);

  function openVendor(vendorId: string) {
    navigation.navigate('ServiceSelection', { vendorId });
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Find your next appointment</Text>

            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search businesses"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FlatList
              horizontal
              data={CATEGORY_FILTERS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => {
                const selected = item === activeCategory;
                return (
                  <Pressable
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item}</Text>
                  </Pressable>
                );
              }}
            />

            {featured.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Featured</Text>
                <FlatList
                  horizontal
                  data={featured}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                  renderItem={({ item }) => (
                    <Pressable style={styles.featuredCard} onPress={() => openVendor(item.id)}>
                      <View style={styles.featuredLogoPlaceholder}>
                        <Text style={styles.logoInitial}>{item.businessName.charAt(0)}</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={1}>
                        {item.businessName}
                      </Text>
                      <Text style={styles.featuredSubtitle}>{item.category}</Text>
                    </Pressable>
                  )}
                />
              </>
            )}

            <Text style={styles.sectionLabel}>
              {activeCategory === ALL_CATEGORIES_FILTER ? 'All businesses' : activeCategory}
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}
            {!error && !vendors && <ActivityIndicator style={styles.loader} />}
            {!error && vendors && filtered.length === 0 && (
              <Text style={styles.empty}>No businesses match — try a different search or category.</Text>
            )}
          </>
        }
        renderItem={({ item }) => <VendorCard vendor={item} onPress={() => openVendor(item.id)} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  search: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111111',
    marginBottom: 16,
  },
  chipRow: {
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#eeeeee',
    marginRight: 10,
  },
  chipSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginTop: 24,
    marginBottom: 12,
  },
  loader: {
    marginTop: 24,
  },
  error: {
    color: '#b00020',
    fontSize: 14,
  },
  empty: {
    color: '#777777',
    fontSize: 14,
  },
  featuredRow: {
    paddingBottom: 4,
  },
  featuredCard: {
    width: 140,
    marginRight: 14,
  },
  featuredLogoPlaceholder: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  featuredSubtitle: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 2,
  },
});
