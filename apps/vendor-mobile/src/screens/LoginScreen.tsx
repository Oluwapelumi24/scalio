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
import { vendorLogin } from '../lib/api';
import { saveSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await vendorLogin(email.trim().toLowerCase(), password);
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
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Please check your credentials.');
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
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.appName}>Scalio Vendor</Text>
          <Text style={styles.subtitle}>Manage your business on the go</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="current-password"
            />
          </View>

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={() => void handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>Sign in</Text>
            )}
          </Pressable>

          <Pressable style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotLabel}>Forgot password?</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.white,
    letterSpacing: -1,
  },
  appName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  forgotBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  forgotLabel: {
    fontSize: typography.size.base,
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },
});
