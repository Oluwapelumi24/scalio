import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelection'>;

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function ServiceSelectionScreen({ route, navigation }: Props) {
  const { vendorId } = route.params;
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    listServices(vendorId)
      .then((result) => {
        if (!cancelled) setServices(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load services.');
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  function toggle(serviceId: string) {
    setSelectedIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  }

  function handleContinue() {
    if (selectedIds.length === 0) return;
    navigation.navigate('ScheduleAppointment', { vendorId, serviceIds: selectedIds });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select services</Text>
      <Text style={styles.subtitle}>You can choose more than one.</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {!error && !services && <ActivityIndicator style={styles.loader} />}
      {!error && services && services.length === 0 && (
        <Text style={styles.empty}>This business hasn&apos;t listed any services yet.</Text>
      )}

      <FlatList
        data={services ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={() => toggle(item.id)}>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSubtitle}>{item.durationMinutes} min</Text>
              </View>
              <Text style={styles.rowPrice}>{formatNaira(item.priceKobo)}</Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        style={[styles.cta, selectedIds.length === 0 && styles.ctaDisabled]}
        onPress={handleContinue}
        disabled={selectedIds.length === 0}
      >
        <Text style={styles.ctaLabel}>
          {selectedIds.length === 0 ? 'Select a service' : `Continue with ${selectedIds.length} selected`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
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
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: '#111111',
    backgroundColor: '#fafafa',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxSelected: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },
  checkboxMark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#cccccc',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
