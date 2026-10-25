import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { vendorLogin } from '../lib/api';
import { saveSession } from '../lib/session';
import { routeAfterSignIn } from '../lib/postAuth';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
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
      navigation.replace(await routeAfterSignIn(res.staff.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        footer={
          <StickyFooter>
            <View style={{ flex: 1, gap: 18 }}>
              <Button label="Sign in" onPress={() => void handleLogin()} loading={loading} />
              <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.foot}>
                  New to Scalio? <Text style={styles.link}>Register your business</Text>
                </Text>
              </Pressable>
            </View>
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          title="Sign in"
          description="Welcome back. Sign in to see your bookings."
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
            autoComplete="current-password"
            textContentType="password"
            error={error || undefined}
            onSubmitEditing={() => void handleLogin()}
            returnKeyType="go"
          />
          <Text style={styles.link} onPress={() => navigation.navigate('ForgotPassword')} accessibilityRole="link">
            Forgot your password?
          </Text>
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  foot: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  link: { fontSize: 16, fontWeight: '600', color: colors.link },
}));
