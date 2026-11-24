import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { forgotPassword, resetPassword } from '../lib/api';
import { setSession } from '../lib/session';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    if (!EMAIL_PATTERN.test(email.trim()) || submitting) return;
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setCodeSent(true);
      Alert.alert('Check your email', 'If that account exists, we sent a 6-digit code.');
    } catch (err) {
      Alert.alert('Could not send code', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (code.trim().length !== 6 || password.length < 8 || submitting) return;
    setSubmitting(true);
    try {
      const session = await resetPassword(email.trim(), code.trim(), password);
      await setSession(session.accessToken, session.user);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Could not reset password', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        footer={
          <StickyFooter>
            <Button
              label={codeSent ? 'Set new password' : 'Send reset code'}
              onPress={() => void (codeSent ? handleReset() : handleSendCode())}
              loading={submitting}
              disabled={codeSent ? code.trim().length !== 6 || password.length < 8 : !EMAIL_PATTERN.test(email.trim())}
            />
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          title="Forgot password"
          description="We will email a code if this address has a Veno account."
        />
        <View style={{ gap: 20 }}>
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!codeSent}
          />
          {codeSent ? (
            <>
              <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              <Field
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <Text style={styles.hint}>At least 8 characters.</Text>
            </>
          ) : null}
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  hint: { color: colors.textSecondary, fontSize: 13 },
}));
