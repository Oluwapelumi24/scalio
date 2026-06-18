import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  getCustomer,
  updateCustomerNotes,
  formatNaira,
  type Customer,
} from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

export function CustomerDetailScreen({ route, navigation }: Props) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await getCustomer(customerId);
      setCustomer(c);
      setNotes(c.notes ?? '');
    } catch {
      Alert.alert('Error', 'Could not load customer.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [customerId, navigation]);

  useEffect(() => { void load(); }, [load]);

  async function saveNotes() {
    if (!customer) return;
    setSavingNotes(true);
    try {
      const updated = await updateCustomerNotes(customer.id, notes);
      setCustomer(updated);
      setNotesDirty(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save notes.');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Customer</Text>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{customer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.profileName}>{customer.name}</Text>
            <Text style={styles.profileEmail}>{customer.email}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statNum}>{customer.bookingCount}</Text>
                <Text style={styles.statLabel}>Total visits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statNum}>{formatNaira(customer.totalSpentKobo)}</Text>
                <Text style={styles.statLabel}>Total spent</Text>
              </View>
              {customer.lastVisitAt && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={styles.statNum}>
                      {new Date(customer.lastVisitAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.statLabel}>Last visit</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Staff notes</Text>
            <Text style={styles.cardSubtitle}>Private notes visible only to your team</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={(v) => { setNotes(v); setNotesDirty(true); }}
              placeholder="Add notes about this customer (allergies, preferences, etc.)…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            {notesDirty && (
              <Pressable
                style={[styles.saveNotesBtn, savingNotes && styles.saveBtnDisabled]}
                onPress={() => void saveNotes()}
                disabled={savingNotes}
              >
                {savingNotes ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveNotesBtnLabel}>Save notes</Text>
                )}
              </Pressable>
            )}
          </View>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
  content: { padding: spacing.xl, gap: spacing.md },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileInitial: { fontSize: 30, fontWeight: typography.weight.bold, color: colors.white },
  profileName: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  profileEmail: { fontSize: typography.size.base, color: colors.textMuted, marginTop: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  statBlock: { alignItems: 'center' },
  statNum: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text },
  statLabel: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.text },
  cardSubtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: -spacing.sm },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.size.base,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 120,
    lineHeight: 22,
  },
  saveNotesBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveNotesBtnLabel: { color: colors.white, fontWeight: typography.weight.semibold, fontSize: typography.size.base },
});
