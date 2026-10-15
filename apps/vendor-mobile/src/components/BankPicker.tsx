import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBanks, type Bank } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

/** A searchable list of Nigerian banks, opened from a field that shows the choice. */
export function BankPicker({ value, onChange }: { value: Bank | null; onChange: (b: Bank) => void }) {
  const [open, setOpen] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || banks.length) return;
    getBanks().then(setBanks).catch((e) => setError(e instanceof Error ? e.message : 'Could not load banks.'));
  }, [open, banks.length]);

  const shown = useMemo(() => banks.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase())), [banks, query]);

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Choose bank">
        <Text style={[styles.fieldText, !value && { color: colors.textMuted }]}>{value?.name ?? 'Choose bank'}</Text>
        <Feather name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Choose bank</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <TextInput style={styles.search} placeholder="Search banks" value={query} onChangeText={setQuery} placeholderTextColor={colors.textMuted} autoFocus />
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : !banks.length ? (
            <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
          ) : (
            <FlatList
              data={shown}
              keyExtractor={(b) => b.code + b.name}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.bank} onPress={() => { onChange(item); setOpen(false); setQuery(''); }}>
                  <Text style={styles.bankName}>{item.name}</Text>
                  {value?.code === item.code && <Feather name="check" size={16} color={colors.accent} />}
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  fieldText: { fontSize: typography.size.base, color: colors.text },
  sheet: { flex: 1, backgroundColor: colors.background },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl },
  sheetTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  search: {
    marginHorizontal: spacing.xl, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text,
  },
  bank: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  bankName: { fontSize: typography.size.md, color: colors.text },
  error: { margin: spacing.xl, color: colors.error },
});
