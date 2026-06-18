import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getBlackoutDates, addBlackoutDate, removeBlackoutDate, type BlackoutDate } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BlackoutDates'>;

export function BlackoutDatesScreen({ navigation }: Props) {
  const [dates, setDates] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateInput, setDateInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setDates(await getBlackoutDates());
    } catch {
      setDates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd() {
    if (!dateInput.trim()) { Alert.alert('Required', 'Please enter a date.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      Alert.alert('Format', 'Use YYYY-MM-DD format (e.g. 2025-01-20).');
      return;
    }
    setAdding(true);
    try {
      const newDate = await addBlackoutDate(dateInput.trim(), reasonInput.trim() || undefined);
      setDates((prev) => [...prev, newDate].sort((a, b) => a.date.localeCompare(b.date)));
      setDateInput('');
      setReasonInput('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add date.');
    } finally {
      setAdding(false);
    }
  }

  function confirmRemove(d: BlackoutDate) {
    Alert.alert(
      'Remove date',
      `Remove blackout on ${d.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBlackoutDate(d.id);
              setDates((prev) => prev.filter((x) => x.id !== d.id));
            } catch {
              Alert.alert('Error', 'Could not remove date.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Blackout dates</Text>
        <Text style={styles.subtitle}>Dates when you won't accept bookings</Text>
      </SafeAreaView>

      {/* Add form */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add a date</Text>
        <TextInput
          style={styles.input}
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          style={styles.input}
          value={reasonInput}
          onChangeText={setReasonInput}
          placeholder="Reason (optional)"
          placeholderTextColor={colors.textMuted}
        />
        <Pressable
          style={[styles.addBtn, adding && { opacity: 0.6 }]}
          onPress={() => void handleAdd()}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Feather name="plus" size={16} color={colors.white} />
              <Text style={styles.addBtnLabel}>Add blackout date</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
      ) : (
        <FlatList
          data={dates}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.dateRow}>
              <View style={styles.dateIconWrap}>
                <Feather name="slash" size={16} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateText}>{item.date}</Text>
                {item.reason ? <Text style={styles.reasonText}>{item.reason}</Text> : null}
              </View>
              <Pressable onPress={() => confirmRemove(item)} hitSlop={8}>
                <Feather name="trash-2" size={18} color={colors.error} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No blackout dates set</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerSafe: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginTop: spacing.md, marginBottom: spacing.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  addCard: {
    margin: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  addTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  addBtnLabel: { color: colors.white, fontWeight: typography.weight.semibold, fontSize: typography.size.base },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxxl },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  reasonText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: typography.size.base },
});
