import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { formatNaira, listCustomers, type Customer } from '../lib/api';
import { TabFrame } from '../components/TabFrame';
import { AddButton, Avatar, EmptyState, PageHeader, SearchField } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Customers'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Sort = 'visits' | 'spent' | 'recent' | 'name';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'visits', label: 'Most visits' },
  { key: 'spent', label: 'Most spent' },
  { key: 'recent', label: 'Most recent visit' },
  { key: 'name', label: 'Name (A–Z)' },
];

function sortClients(list: Customer[], sort: Sort) {
  const out = [...list];
  switch (sort) {
    case 'visits': return out.sort((a, b) => b.bookingCount - a.bookingCount);
    case 'spent': return out.sort((a, b) => b.totalSpentKobo - a.totalSpentKobo);
    case 'recent': return out.sort((a, b) => (b.lastVisitAt ?? '').localeCompare(a.lastVisitAt ?? ''));
    default: return out.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/** Every client of the business, searchable and sortable. */
export function CustomersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState<Customer[] | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('visits');
  const [sorting, setSorting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setClients(await listCustomers());
      setError('');
    } catch (err) {
      setClients([]);
      setError(err instanceof Error ? err.message : 'Could not load your clients.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const q = query.trim().toLowerCase();
  const shown = sortClients(
    (clients ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q)),
    sort,
  );

  return (
    <TabFrame>
      <FlatList
        data={clients ? shown : []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}
        ListHeaderComponent={
          <View style={{ gap: 22, marginBottom: 12 }}>
            <PageHeader
              title="Clients"
              count={clients?.length}
              description="Everyone who has booked with you, and how often they come back."
              actions={<AddButton label="Book" onPress={() => navigation.navigate('NewBooking')} />}
            />
            <SearchField value={query} onChangeText={setQuery} placeholder="Name or email" onFilter={() => setSorting(true)} />
            {clients == null ? <ActivityIndicator color={colors.link} style={{ marginTop: 24 }} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            accessibilityRole="button"
          >
            <Avatar name={item.name} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {item.email ? <Text style={styles.sub} numberOfLines={1}>{item.email}</Text> : null}
              <Text style={styles.meta}>
                {item.bookingCount} {item.bookingCount === 1 ? 'visit' : 'visits'} · {formatNaira(item.totalSpentKobo)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          clients == null ? null : (
            <EmptyState
              icon="users"
              title={error ? 'Could not load your clients' : q ? 'No clients found' : 'No clients yet'}
              body={error || (q ? 'Try another name or email.' : 'Clients appear here after their first booking.')}
            />
          )
        }
      />

      <Modal visible={sorting} transparent animationType="slide" onRequestClose={() => setSorting(false)}>
        <Pressable style={styles.overlay} onPress={() => setSorting(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Sort clients</Text>
          {SORTS.map((s) => (
            <Pressable key={s.key} style={styles.sheetRow} onPress={() => { setSort(s.key); setSorting(false); }} accessibilityRole="radio" accessibilityState={{ checked: s.key === sort }}>
              <Text style={styles.sheetLabel}>{s.label}</Text>
              {s.key === sort ? <Feather name="check" size={22} color={colors.link} /> : null}
            </Pressable>
          ))}
        </View>
      </Modal>
    </TabFrame>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 12 },
  name: { fontSize: 18, fontWeight: '600', color: colors.text },
  sub: { fontSize: 15, color: colors.textSecondary },
  meta: { fontSize: 14, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: GUTTER, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 14 },
  sheetTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  sheetLabel: { fontSize: 17, color: colors.text },
}));
