import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listServices, deleteService, formatNaira, type VendorService } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Services'>;

const MODE_LABEL: Record<string, string> = {
  pay_on_arrival: 'Pay on arrival',
  deposit: 'Deposit required',
  full_prepayment: 'Full prepayment',
};

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: VendorService;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceMeta}>
            {service.durationMinutes} min · {MODE_LABEL[service.paymentMode] ?? service.paymentMode}
          </Text>
        </View>
        <Text style={styles.servicePrice}>{formatNaira(service.priceKobo)}</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={onEdit}>
          <Feather name="edit-2" size={15} color={colors.accent} />
          <Text style={[styles.actionLabel, { color: colors.accent }]}>Edit</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete}>
          <Feather name="trash-2" size={15} color={colors.error} />
          <Text style={[styles.actionLabel, { color: colors.error }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ServicesScreen({ navigation }: Props) {
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setServices(await listServices());
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function confirmDelete(service: VendorService) {
    Alert.alert(
      'Delete service',
      `Remove "${service.name}"? Existing bookings are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(service.id);
              setServices((prev) => prev.filter((s) => s.id !== service.id));
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete service.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('ServiceForm', {})}
          >
            <Feather name="plus" size={18} color={colors.white} />
            <Text style={styles.addBtnLabel}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Services</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onEdit={() => navigation.navigate('ServiceForm', { service: item })}
              onDelete={() => confirmDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="briefcase" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No services yet</Text>
              <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('ServiceForm', {})}>
                <Text style={styles.emptyBtnLabel}>Add your first service</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addBtnLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.white },
  list: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  serviceName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  serviceMeta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  servicePrice: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  cardActions: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.lg },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
  emptyBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill },
  emptyBtnLabel: { color: colors.white, fontWeight: typography.weight.semibold },
});
