import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getBusinessHours, setBusinessHours, type BusinessHours } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessHours'>;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS: BusinessHours[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: i === 0,
}));

export function BusinessHoursScreen({ navigation }: Props) {
  const [hours, setHours] = useState<BusinessHours[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getBusinessHours();
      if (data.length > 0) setHours(data);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function update(dayOfWeek: number, patch: Partial<BusinessHours>) {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setBusinessHours(hours);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save hours.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Business hours</Text>
        <Text style={styles.subtitle}>Set your weekly schedule</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {hours.map((h) => (
            <View key={h.dayOfWeek} style={styles.dayRow}>
              <View style={styles.dayLeft}>
                <Text style={styles.dayName}>{DAYS[h.dayOfWeek]}</Text>
                <Switch
                  value={!h.isClosed}
                  onValueChange={(open) => update(h.dayOfWeek, { isClosed: !open })}
                  trackColor={{ false: colors.border, true: colors.accentLight }}
                  thumbColor={!h.isClosed ? colors.accent : colors.disabled}
                />
              </View>
              {h.isClosed ? (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedText}>Closed</Text>
                </View>
              ) : (
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={h.openTime}
                    onChangeText={(v) => update(h.dayOfWeek, { openTime: v })}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.timeSep}>—</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={h.closeTime}
                    onChangeText={(v) => update(h.dayOfWeek, { closeTime: v })}
                    placeholder="18:00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              )}
            </View>
          ))}

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnLabel}>Save hours</Text>}
          </Pressable>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
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
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.xs },
  content: { padding: spacing.xl, gap: spacing.sm },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: 140 },
  dayName: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.text, flex: 1 },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInput: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.size.base,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  timeSep: { fontSize: typography.size.lg, color: colors.textMuted },
  closedBadge: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: { fontSize: typography.size.sm, color: colors.textMuted, fontWeight: typography.weight.medium },
  saveBtn: {
    marginTop: spacing.md,
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
});
