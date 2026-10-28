import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { signUp } from '../lib/api';
import { setSession } from '../lib/session';
import { registerForPushNotifications } from '../lib/push';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function SignUpScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const isOnboarding = route.params?.mode === 'onboarding';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        footer={
          <StickyFooter>
            <View style={{ flex: 1, gap: 18 }}>
              <Button label="Continue" onPress={() => void handleContinue()} loading={submitting} disabled={!isValid} />
              <Pressable onPress={() => navigation.replace('SignIn', route.params)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.foot}>
                  Already have an account? <Text style={styles.link}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          title="Create your account"
          description={
            isOnboarding
              ? 'Just a few details and you’re in. No verification emails to chase.'
              : 'Create an account to finish booking.'
          }
        />
        <View style={{ gap: 20 }}>
          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="Ada Lovelace"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            helper="Use 8 or more characters."
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
          />
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  foot: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  link: { fontSize: 14, fontWeight: '600', color: colors.link },
}));
