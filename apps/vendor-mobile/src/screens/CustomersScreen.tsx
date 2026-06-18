import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { listCustomers, formatNaira, type Customer } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Customers'>,
  NativeStackScreenProps<RootStackParamList>
>;

function CustomerCard({ customer, onPress }: { customer: Customer; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetter}>{customer.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.email} numberOfLines={1}>{customer.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{customer.bookingCount}</Text>
            <Text style={styles.statLabel}>visits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{formatNaira(customer.totalSpentKobo)}</Text>
            <Text style={styles.statLabel}>spent</Text>
          </View>
          {customer.lastVisitAt && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum} numberOfLines={1}>
                  {new Date(customer.lastVisitAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </Text>
                <Text style={styles.statLabel}>last visit</Text>
              </View>
            </>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export function CustomersScreen({ navigation }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listCustomers();
      setCustomers(data.sort((a, b) => b.bookingCount - a.bookingCount));
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()),
      )
    : customers;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.count}>{customers.length} total</Text>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CustomerCard
              customer={item}
              onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>{query ? 'No customers found' : 'No customers yet'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  count: { fontSize: typography.size.sm, color: colors.textMuted },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: typography.size.base, color: colors.text },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
  info: { flex: 1 },
  name: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  email: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  stat: { alignItems: 'center' },
  statNum: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted },
  statDivider: { width: 1, height: 16, backgroundColor: colors.border },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.lg },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
});
