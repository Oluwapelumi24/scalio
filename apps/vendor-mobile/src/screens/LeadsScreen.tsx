import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, getLeadSummary, listLeads, type Lead, type LeadStatus } from '../lib/api';
import { getSession } from '../lib/session';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Leads'>;
type Filter = 'due' | 'open' | LeadStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'due', label: 'To follow up' },
  { id: 'open', label: 'All open' },
  { id: 'won', label: 'Customers' },
  { id: 'lost', label: 'Not interested' },
];

const EMPTY: Record<Filter, string> = {
  due: 'Nobody to follow up right now.',
  open: 'No open leads. Add people who ask about your business — from DMs, calls or walk-ins — so nobody slips through.',
  new: '', contacted: '',
  won: 'Leads you turn into customers show up here.',
  lost: 'Nothing here.',
};

export function LeadsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [filter, setFilter] = useState<Filter>(route.params?.filter ?? 'due');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<{ open: number; due: number; won30d: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const practitioner = getSession()?.role === 'practitioner';

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        filter === 'due' ? listLeads({ due: true })
          : filter === 'open' ? listLeads().then((all) => all.filter((x) => x.status === 'new' || x.status === 'contacted'))
          : listLeads({ status: filter }),
        getLeadSummary(),
      ]);
      setLeads(l); setSummary(s); setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [filter]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Leads</Text>
          <Pressable style={styles.newBtn} onPress={() => navigation.navigate('LeadDetail', {})} accessibilityRole="button">
            <Feather name="plus" size={16} color={colors.white} />
            <Text style={styles.newText}>Add lead</Text>
          </Pressable>
        </View>
        {summary && (
          <Text style={styles.summary}>
            {summary.open} open · {summary.due} to follow up · {summary.won30d} became customers in the last 30 days
            {practitioner ? ' (yours)' : ''}
          </Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => { setLoading(true); setFilter(f.id); }} style={[styles.chip, filter === f.id && styles.chipOn]} accessibilityState={{ selected: filter === f.id }}>
              <Text style={[styles.chipText, filter === f.id && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          {error ? (
            <View style={styles.card}>
              <Text style={styles.meta}>Couldn't load leads. {error}</Text>
              <Pressable onPress={() => { setLoading(true); void load(); }}><Text style={styles.link}>Try again</Text></Pressable>
            </View>
          ) : leads.length === 0 ? (
            <View style={styles.card}><Text style={styles.meta}>{EMPTY[filter]}</Text></View>
          ) : leads.map((l) => (
            <Pressable key={l.id} style={styles.row} onPress={() => navigation.navigate('LeadDetail', { leadId: l.id })} accessibilityRole="button">
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name}>{l.name}</Text>
                <Text style={styles.meta}>
                  {LEAD_SOURCE_LABELS[l.source]} · {LEAD_STATUS_LABELS[l.status]}
                  {l.assignedStaff && !practitioner ? ` · ${l.assignedStaff.name}` : ''}
                </Text>
                {l.note ? <Text style={styles.note} numberOfLines={1}>{l.note}</Text> : null}
              </View>
              {l.due ? (
                <View style={styles.due}><Text style={styles.dueText}>Follow up</Text></View>
              ) : l.followUpAt && (l.status === 'new' || l.status === 'contacted') ? (
                <Text style={styles.meta}>{new Date(l.followUpAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
              ) : null}
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  back: { width: 44, height: 44, justifyContent: 'center', marginTop: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  summary: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  content: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  note: { fontSize: typography.size.sm, color: colors.textSecondary },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
  link: { color: colors.accent, fontWeight: typography.weight.bold },
  due: { backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dueText: { fontSize: typography.size.xs, color: colors.warning, fontWeight: typography.weight.bold },
}));
