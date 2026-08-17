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
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { signUp } from '../lib/api';
import { setSession } from '../lib/session';
import { registerForPushNotifications } from '../lib/push';
import { BackButton } from '../components/BackButton';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function SignUpScreen({ navigation, route }: Props) {
  const isOnboarding = route.params?.mode === 'onboarding';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValid =
    name.trim().length > 0 &&
    EMAIL_PATTERN.test(email.trim()) &&
    password.length >= MIN_PASSWORD_LENGTH;

  async function handleContinue() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const { accessToken, user } = await signUp(name.trim(), email.trim(), password);
      await setSession(accessToken, user);
      void registerForPushNotifications(user.id);

      if (isOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not create your account', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.copy}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          {isOnboarding
            ? "Just a few details and you're in — no verification emails to chase."
            : 'Create an account to finish booking.'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ada Lovelace"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ada@example.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoComplete="password-new"
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottomGroup}>
        <Pressable
          style={[styles.cta, (!isValid || submitting) && styles.ctaDisabled]}
          onPress={() => void handleContinue()}
          disabled={!isValid || submitting}
        >
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.ctaLabel}>Continue</Text>}
        </Pressable>

        <Pressable
          style={styles.switchLink}
          onPress={() => navigation.replace('SignIn', route.params)}
        >
          <Text style={styles.switchLinkText}>
            Already have an account? <Text style={styles.switchLinkBold}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  copy: {
    marginTop: 40,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  form: {
    marginTop: spacing.xxl,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    marginBottom: spacing.xs + 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: typography.size.lg,
    color: colors.primary,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
  },
  bottomGroup: {
    marginTop: 'auto',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  switchLink: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  switchLinkText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  switchLinkBold: {
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
});
