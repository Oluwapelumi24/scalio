import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl } from '../lib/categories';
import { colors, radius, spacing, typography } from '../theme';
import { BackButton } from '../components/BackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelection'>;

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function ServiceSelectionScreen({ route, navigation }: Props) {
  const { vendor } = route.params;
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    listServices(vendor.id)
      .then((result) => {
        if (!cancelled) setServices(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load services.');
      });
    return () => {
      cancelled = true;
    };
  }, [vendor.id]);

  function toggle(serviceId: string) {
    setSelectedIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    );
  }

  const selectedServices = useMemo(
    () => services?.filter((service) => selectedIds.includes(service.id)) ?? [],
    [services, selectedIds],
  );

  function handleContinue() {
    if (selectedServices.length === 0) return;
    navigation.navigate('ScheduleAppointment', { vendor, services: selectedServices });
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      <FlatList
        style={styles.list}
        data={services ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.vendorHeader}>
              <View style={styles.vendorImageWrap}>
                <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.vendorImage} />
                <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
                  <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
                </View>
              </View>
              <View style={styles.vendorHeaderCopy}>
                <Text style={styles.vendorName}>{vendor.businessName}</Text>
                <Text style={styles.vendorCategory}>{vendor.category}</Text>
              </View>
            </View>

            <Text style={styles.title}>Select services</Text>
            <Text style={styles.subtitle}>You can choose more than one.</Text>

            {error && <Text style={styles.error}>{error}</Text>}
            {!error && !services && <ActivityIndicator style={styles.loader} />}
            {!error && services && services.length === 0 && (
              <Text style={styles.empty}>This business hasn&apos;t listed any services yet.</Text>
            )}
          </>
        }
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  vendorImageWrap: {
    width: 64,
    height: 64,
    marginRight: spacing.md,
    position: 'relative',
  },
  vendorImage: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  categoryBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  vendorHeaderCopy: {
    flex: 1,
  },
  vendorName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  vendorCategory: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  loader: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.error,
    fontSize: typography.size.base,
    marginBottom: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.size.base,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#fafafa',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  rowCopy: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  rowSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
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
    color: colors.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
});
