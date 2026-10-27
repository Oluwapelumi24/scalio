import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageSource } from '../lib/categories';
import { Button, EmptyState, PageHeader, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelection'>;

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function ServiceSelectionScreen({ route, navigation }: Props) {
  const { vendor } = route.params;
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <FlatList
        data={services ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              onBack={() => navigation.goBack()}
              eyebrow={
                <View style={styles.vendor}>
                  <View>
                    <Image source={getVendorImageSource(vendor)} style={styles.vendorImage} />
                    <View style={[styles.categoryBadge, { backgroundColor: getVendorAccentColor(vendor) }]}>
                      <Feather name={getCategoryMeta(vendor.category).icon} size={12} color={colors.white} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>{vendor.businessName}</Text>
                    <Text style={styles.vendorCategory}>{vendor.category}</Text>
                  </View>
                </View>
              }
              title="Choose services"
              description="You can pick more than one."
            />
            {error ? <EmptyState icon="wifi-off" title="Couldn’t load services" body={error} /> : null}
            {!error && !services ? <ActivityIndicator color={colors.link} style={{ marginTop: spacing.xl }} /> : null}
            {!error && services && services.length === 0 ? (
              <EmptyState icon="book-open" title="No services yet" body="This business hasn’t listed any services." />
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Pressable
              style={[styles.row, selected && styles.rowOn]}
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <View style={[styles.check, selected && styles.checkOn]}>
                {selected ? <Feather name="check" size={14} color={colors.onAccent} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.durationMinutes} min</Text>
              </View>
              <Text style={styles.rowPrice}>{formatNaira(item.priceKobo)}</Text>
            </Pressable>
          );
        }}
      />

      <StickyFooter>
        <Button
          label={selectedIds.length === 0 ? 'Choose a service' : `Continue with ${selectedIds.length}`}
          onPress={handleContinue}
          disabled={selectedIds.length === 0}
          style={{ flex: 1 }}
        />
      </StickyFooter>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: GUTTER, paddingBottom: 32, gap: 10 },
  header: { gap: 20, marginBottom: spacing.sm },
  vendor: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  vendorImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surface },
  categoryBadge: {
    position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
  },
  vendorName: { fontSize: 15, fontWeight: '600', color: colors.text },
  vendorCategory: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.link, backgroundColor: colors.accentLight },
  check: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textSecondary },
  rowPrice: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
}));
