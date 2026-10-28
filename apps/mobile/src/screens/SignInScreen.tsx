import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { signIn } from '../lib/api';
import { setSession } from '../lib/session';
import { registerForPushNotifications } from '../lib/push';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const isOnboarding = route.params?.mode === 'onboarding';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = EMAIL_PATTERN.test(email.trim()) && password.length > 0;

  async function handleContinue() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const { accessToken, user } = await signIn(email.trim(), password);
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
      Alert.alert('Could not sign in', message);
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
              <Button label="Sign in" onPress={() => void handleContinue()} loading={submitting} disabled={!isValid} />
              <Pressable onPress={() => navigation.replace('SignUp', route.params)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.foot}>
                  New to Scalio? <Text style={styles.link}>Create an account</Text>
                </Text>
              </Pressable>
            </View>
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          title="Sign in"
          description="Welcome back. Sign in to book and see your appointments."
        />
        <View style={{ gap: 20 }}>
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
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={() => void handleContinue()}
            returnKeyType="go"
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
