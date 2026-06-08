import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { signUp } from '../lib/api';
import { setCurrentUser } from '../lib/session';
import { registerForPushNotifications } from '../lib/push';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 0 && EMAIL_PATTERN.test(email.trim());

  async function handleContinue() {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const user = await signUp(name.trim(), email.trim());
      setCurrentUser(user);
      void registerForPushNotifications(user.id);
      navigation.navigate('VendorSelection');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not create your account', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Just your name and email — that&apos;s all we need to get started.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ada Lovelace"
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
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        </View>
      </View>

      <Pressable
        style={[styles.cta, (!isValid || submitting) && styles.ctaDisabled]}
        onPress={() => void handleContinue()}
        disabled={!isValid || submitting}
      >
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.ctaLabel}>Continue</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 64,
    backgroundColor: '#ffffff',
  },
  copy: {
    marginTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 21,
  },
  form: {
    marginTop: 32,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#cccccc',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
