import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Vendor } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listVendors } from '../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'VendorSelection'>;

export function VendorSelectionScreen({ navigation }: Props) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a business</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!error && !vendors && <ActivityIndicator style={styles.loader} />}
      {!error && vendors && vendors.length === 0 && (
        <Text style={styles.empty}>No businesses are available yet — check back soon.</Text>
      )}

      <FlatList
        data={vendors ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ServiceSelection', { vendorId: item.id })}
          >
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{item.businessName.charAt(0)}</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{item.businessName}</Text>
              <Text style={styles.cardSubtitle}>{item.category}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
  error: {
    color: '#b00020',
    fontSize: 14,
    marginBottom: 16,
  },
  empty: {
    color: '#777777',
    fontSize: 14,
  },
  list: {
    paddingBottom: 24,
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
