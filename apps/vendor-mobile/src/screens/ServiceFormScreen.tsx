import { useEffect, useState } from 'react';
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
import { createService, updateService, type PaymentMode } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceForm'>;

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'pay_on_arrival', label: 'Pay on arrival' },
  { value: 'deposit', label: 'Deposit required' },
  { value: 'full_prepayment', label: 'Full prepayment' },
];

export function ServiceFormScreen({ route, navigation }: Props) {
  const existing = route.params?.service;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [duration, setDuration] = useState(String(existing?.durationMinutes ?? '60'));
  const [price, setPrice] = useState(existing ? String(existing.priceKobo / 100) : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(existing?.paymentMode ?? 'pay_on_arrival');
  const [depositPercent, setDepositPercent] = useState(String(existing?.depositPercent ?? '30'));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Service name is required.'); return; }
    const durationMins = parseInt(duration, 10);
    const priceKobo = Math.round(parseFloat(price) * 100);
    if (isNaN(durationMins) || durationMins <= 0) { Alert.alert('Invalid', 'Duration must be a positive number.'); return; }
    if (isNaN(priceKobo) || priceKobo <= 0) { Alert.alert('Invalid', 'Price must be a positive number.'); return; }

    const payload = {
      name: name.trim(),
      durationMinutes: durationMins,
      priceKobo,
      paymentMode,
      ...(paymentMode === 'deposit' ? { depositPercent: parseInt(depositPercent, 10) } : {}),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateService(existing.id, payload);
      } else {
        await createService(payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save service.');
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
        <Text style={styles.screenTitle}>{isEdit ? 'Edit service' : 'New service'}</Text>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

          <View style={styles.field}>
            <Text style={styles.label}>Service name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Classic Manicure"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Price (₦)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="5000"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Payment mode</Text>
            <View style={styles.modeRow}>
              {PAYMENT_MODES.map((m) => (
                <Pressable
                  key={m.value}
                  style={[styles.modePill, paymentMode === m.value && styles.modePillActive]}
                  onPress={() => setPaymentMode(m.value)}
                >
                  <Text style={[styles.modeLabel, paymentMode === m.value && styles.modeLabelActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {paymentMode === 'deposit' && (
            <View style={styles.field}>
              <Text style={styles.label}>Deposit percentage (%)</Text>
              <TextInput
                style={styles.input}
                value={depositPercent}
                onChangeText={setDepositPercent}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnLabel}>Save service</Text>}
          </Pressable>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginTop: spacing.md, marginBottom: spacing.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  form: { padding: spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: spacing.sm },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.size.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  modeRow: { gap: spacing.sm },
  modePill: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  modePillActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  modeLabel: { fontSize: typography.size.base, color: colors.textSecondary, fontWeight: typography.weight.medium },
  modeLabelActive: { color: colors.accent, fontWeight: typography.weight.semibold },
  saveBtn: {
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
});
