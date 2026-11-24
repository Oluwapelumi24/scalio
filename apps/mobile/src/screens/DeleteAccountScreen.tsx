import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { deleteAccount } from '../lib/api';
import { signOut } from '../lib/session';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: Props) {
  const styles = useStyles();
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!confirmed || !password || submitting) return;
    setSubmitting(true);
    try {
      await deleteAccount(password);
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again.');
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
              label="Delete my account"
              variant="danger"
              onPress={() => void handleDelete()}
              loading={submitting}
              disabled={!confirmed || password.length === 0}
            />
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          title="Delete account"
        />
        <View style={{ gap: 20 }}>
          <Text style={styles.summary}>
            This permanently deletes your Veno account. Your name, email and phone number will also be
            removed from the businesses you've booked with. Upcoming bookings will be cancelled. Businesses
            keep an anonymous record of past visits and payments for their accounts. This can't be undone.
          </Text>
          <Text style={styles.warning}>Type your password to confirm.</Text>
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Button
            label={confirmed ? 'Confirmed — ready to delete' : 'I understand, continue'}
            onPress={() => setConfirmed(true)}
            disabled={confirmed}
          />
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  summary: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  warning: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
}));
