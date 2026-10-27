import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { setHasSeenOnboarding, setLocation } from '../lib/preferences';
import { AppTile, Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationSetup'>;

type LocationState =
  | { phase: 'requesting' }
  | { phase: 'detected'; label: string; lat: number; lng: number }
  | { phase: 'denied' }
  | { phase: 'error' };

export function LocationSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [locState, setLocState] = useState<LocationState>({ phase: 'requesting' });
  const [manual, setManual] = useState('');

  useEffect(() => {
    void detectLocation();
  }, []);

  async function detectLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocState({ phase: 'denied' });
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const label =
        [place?.city, place?.region]
          .filter(Boolean)
          .join(', ') || place?.formattedAddress || 'Your location';

      setLocState({
        phase: 'detected',
        label,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      setLocState({ phase: 'error' });
    }
  }

  async function handleUseDetected() {
    if (locState.phase !== 'detected') return;
    await setLocation({ label: locState.label, lat: locState.lat, lng: locState.lng });
    await setHasSeenOnboarding();
    navigation.navigate('SignUp', { mode: 'onboarding' });
  }

  async function handleManualContinue() {
    const label = manual.trim();
    if (!label) return;
    Keyboard.dismiss();
    await setLocation({ label });
    await setHasSeenOnboarding();
    navigation.navigate('SignUp', { mode: 'onboarding' });
  }

  async function handleSkip() {
    await setHasSeenOnboarding();
    navigation.navigate('SignUp', { mode: 'onboarding' });
  }

  const canManualContinue = manual.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page
        footer={
          <StickyFooter>
            <View style={{ flex: 1, gap: 18 }}>
              <Button label="Confirm location" onPress={() => void handleManualContinue()} disabled={!canManualContinue} />
              <Pressable onPress={() => void handleSkip()} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.skip}>Skip for now</Text>
              </Pressable>
            </View>
          </StickyFooter>
        }
      >
        <PageHeader
          onBack={() => navigation.goBack()}
          eyebrow={<AppTile icon="map-pin" />}
          title="Where are you based?"
          description="We’ll show you the best services and businesses near you."
        />

        {locState.phase === 'requesting' ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.link} />
            <Text style={styles.cardSub}>Finding your location…</Text>
          </View>
        ) : null}

        {locState.phase === 'detected' ? (
          <Pressable
            style={({ pressed }) => [styles.card, styles.cardOn, pressed && { opacity: 0.85 }]}
            onPress={() => void handleUseDetected()}
            accessibilityRole="button"
            accessibilityLabel={`Use ${locState.label}`}
          >
            <Feather name="navigation" size={22} color={colors.link} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardTitle}>{locState.label}</Text>
              <Text style={styles.cardSub}>Tap to use this location</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.text} />
          </Pressable>
        ) : null}

        {locState.phase === 'denied' || locState.phase === 'error' ? (
          <Pressable style={styles.card} onPress={() => void detectLocation()} accessibilityRole="button">
            <Feather name="alert-circle" size={22} color={colors.warning} />
            <Text style={[styles.cardSub, { flex: 1 }]}>
              {locState.phase === 'denied'
                ? 'Location access is off. Turn it on in Settings, or type your city below.'
                : 'We couldn’t find your location.'}
            </Text>
            {locState.phase === 'error' ? <Text style={styles.retry}>Retry</Text> : null}
          </Pressable>
        ) : null}

        <Field
          label="Or type your city"
          placeholder="City or neighbourhood, e.g. Lagos"
          value={manual}
          onChangeText={setManual}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => void handleManualContinue()}
        />
      </Page>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  cardOn: { borderColor: colors.link, backgroundColor: colors.accentLight },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  retry: { fontSize: 14, fontWeight: '600', color: colors.link },
  skip: { fontSize: 14, fontWeight: '600', color: colors.link, textAlign: 'center' },
}));
