import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { vendorRegister } from '../lib/api';
import { saveSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    if (!ownerName.trim() || !businessName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await vendorRegister(ownerName.trim(), businessName.trim(), email.trim().toLowerCase(), password, registrationNumber.trim() || undefined);
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
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.fill}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back */}
            <Pressable style={s.back} onPress={() => navigation.goBack()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>

            {/* Header */}
            <Text style={s.title}>Register your business</Text>
            <Text style={s.subtitle}>Create your Scalio vendor account. Your listing will be reviewed before going live.</Text>

            {/* Fields */}
            <View style={s.form}>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Your name</Text>
                <TextInput
                  style={s.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="e.g. Amaka Okafor"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Business name</Text>
                <TextInput
                  style={s.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Glam Nails Studio"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Business registration number <Text style={s.optional}>(optional)</Text></Text>
                <TextInput
                  style={s.input}
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="e.g. RC1234567"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Email address</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@business.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Password</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[s.btn, loading && s.btnDisabled]}
                onPress={() => void handleRegister()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.btnLabel}>Create account</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </Pressable>

              <View style={s.loginRow}>
                <Text style={s.loginPrompt}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                  <Text style={s.loginLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  back: {
    paddingVertical: spacing.lg,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  form: { gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  optional: {
    fontWeight: typography.weight.regular,
    color: colors.textMuted,
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
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    fontWeight: typography.weight.medium,
  },
  btn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  loginLink: {
    fontSize: typography.size.sm,
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },
});
