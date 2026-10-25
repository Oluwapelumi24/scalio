import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createService, updateService, type PaymentMode } from '../lib/api';
import { Button, Field, Page, PageHeader, SectionTitle, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceForm'>;

const PAYMENT_MODES: { value: PaymentMode; label: string; help: string }[] = [
  { value: 'pay_on_arrival', label: 'Pay at the appointment', help: 'Clients book now and pay when they arrive.' },
  { value: 'deposit', label: 'Deposit to book', help: 'Clients pay part of the price online to hold the slot.' },
  { value: 'full_prepayment', label: 'Pay in full to book', help: 'Clients pay the whole price online when they book.' },
];

export function ServiceFormScreen({ route, navigation }: Props) {
  const styles = useStyles();
  const existing = route.params?.service;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [duration, setDuration] = useState(String(existing?.durationMinutes ?? '60'));
  const [price, setPrice] = useState(existing ? String(existing.priceKobo / 100) : '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(existing?.paymentMode ?? 'pay_on_arrival');
  const [depositPercent, setDepositPercent] = useState(String(existing?.depositPercent ?? '30'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const durationMins = parseInt(duration, 10);
    const priceKobo = Math.round(parseFloat(price) * 100);
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Add a name for the service.';
    if (isNaN(durationMins) || durationMins <= 0) next.duration = 'Enter how many minutes it takes.';
    if (isNaN(priceKobo) || priceKobo <= 0) next.price = 'Enter a price above ₦0.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: name.trim(),
      durationMinutes: durationMins,
      priceKobo,
      paymentMode,
      ...(paymentMode === 'deposit' ? { depositPercent: parseInt(depositPercent, 10) } : {}),
    };

    setSaving(true);
    try {
      if (isEdit) await updateService(existing.id, payload);
      else await createService(payload);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save the service', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        footer={
          <StickyFooter>
            <Button label="Save" onPress={() => void handleSave()} loading={saving} style={{ flex: 1 }} />
          </StickyFooter>
        }
      >
        <PageHeader onClose={() => navigation.goBack()} title={isEdit ? 'Edit service' : 'Add new service'} />

        <View style={styles.section}>
          <SectionTitle title="Basic info" />
          <Field label="Service name" value={name} onChangeText={setName} placeholder="e.g. Box braids" error={errors.name} autoCapitalize="sentences" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Duration (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="60" error={errors.duration} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Price (₦)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="5000" error={errors.price} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle title="Payment" />
          {PAYMENT_MODES.map((m) => {
            const on = paymentMode === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setPaymentMode(m.value)}
                style={styles.option}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.radio, on && styles.radioOn]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.optionLabel}>{m.label}</Text>
                  <Text style={styles.optionHelp}>{m.help}</Text>
                </View>
              </Pressable>
            );
          })}
          {paymentMode === 'deposit' ? (
            <Field
              label="Deposit (%)"
              value={depositPercent}
              onChangeText={setDepositPercent}
              keyboardType="number-pad"
              placeholder="30"
              helper="Online payments need your bank account set up under Money → Online payments."
            />
          ) : null}
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  section: { gap: 18 },
  row: { flexDirection: 'row', gap: 14 },
  option: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 6 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, marginTop: 1 },
  radioOn: { borderColor: colors.accent, borderWidth: 7 },
  optionLabel: { fontSize: 17, fontWeight: '500', color: colors.text },
  optionHelp: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
}));
