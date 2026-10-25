import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getReportRecords, naira, type ReportRecord } from '../lib/api';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportRecords'>;

const STATUS: Record<string, string> = {
  completed: 'Completed', confirmed: 'Coming up', pending_payment: 'Waiting for payment',
  cancelled_by_customer: 'Cancelled by customer', cancelled_by_vendor: 'Cancelled by you', no_show: 'No-show',
};

const when = (at: string | null) => (at ? new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function describe(r: ReportRecord): { title: string; detail: string; amount: string | null } {
  switch (r.type) {
    case 'booking':
      return {
        title: r.customerName ?? 'Customer',
        detail: [when(r.at), r.status ? STATUS[r.status] ?? r.status : null, r.services?.join(', '), r.staffName].filter(Boolean).join(' · '),
        amount: r.amountKobo !== undefined ? naira(r.amountKobo) : null,
      };
    case 'expense':
      return { title: r.label ?? 'Expense', detail: [when(r.at), r.note].filter(Boolean).join(' · '), amount: r.amountKobo !== undefined ? naira(r.amountKobo) : null };
    case 'ledger':
      return { title: r.label ?? '', detail: when(r.at), amount: r.amountKobo !== undefined ? `${r.direction === 'in' ? '+' : '−'}${naira(r.amountKobo)}` : null };
    case 'customer':
      return {
        title: r.name ?? 'Customer',
        detail: [r.label, r.visits !== undefined ? `${r.visits} visit${r.visits === 1 ? '' : 's'}` : null, r.at ? `last ${when(r.at)}` : null].filter(Boolean).join(' · '),
        amount: r.amountKobo !== undefined ? naira(r.amountKobo) : null,
      };
  }
}

export function ReportRecordsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { kind, key, title, from, to } = route.params;
  const [records, setRecords] = useState<ReportRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReportRecords(kind, from, to, key).then(setRecords).catch((err) => setError(err instanceof Error ? err.message : 'Please try again.'));
  }, [kind, key, from, to]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.meta}>{when(from)} – {when(to)}{records ? ` · ${records.length}${records.length >= 500 ? '+' : ''} records` : ''}</Text>
      </SafeAreaView>

      {error ? <Text style={[styles.meta, { padding: spacing.xl }]}>Couldn't load these records. {error}</Text>
        : !records ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
        : (
          <FlatList
            data={records}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.content}
            ListEmptyComponent={<Text style={styles.meta}>Nothing here for this period.</Text>}
            renderItem={({ item }) => {
              const d = describe(item);
              const row = (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{d.title}</Text>
                    <Text style={styles.meta}>{d.detail}</Text>
                  </View>
                  {d.amount && <Text style={styles.amount}>{d.amount}</Text>}
                  {item.type === 'customer' && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
                </View>
              );
              return item.type === 'customer'
                ? <Pressable onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })} accessibilityRole="button">{row}</Pressable>
                : row;
            }}
          />
        )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md, gap: 4 },
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  content: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  rowTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  amount: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text, fontVariant: ['tabular-nums'] },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
}));
