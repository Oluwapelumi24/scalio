import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { resetPassword } from '../lib/api';
import { saveSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords are the same.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(email, code, password);
      await saveSession({
        staffId: res.staff.id,
        vendorId: res.staff.vendorId,
        name: res.staff.name,
        email: res.staff.email,
        role: res.staff.role,
        token: res.accessToken,
      });
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Reset failed', err instanceof Error ? err.message : 'The code may be invalid or expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>.
            Enter it below along with your new password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reset code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={() => void handleReset()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>Reset password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  back: { marginBottom: spacing.xxxl },
  backLabel: {
    fontSize: typography.size.base,
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },
  header: { marginBottom: spacing.xxxl },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },
  form: { gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
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
  codeInput: {
    fontSize: typography.size.xl,
    letterSpacing: 8,
    textAlign: 'center',
  },
  btn: {
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
});
