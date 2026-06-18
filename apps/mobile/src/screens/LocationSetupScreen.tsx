import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { setHasSeenOnboarding, setLocation } from '../lib/preferences';
import { BackButton } from '../components/BackButton';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationSetup'>;

type LocationState =
  | { phase: 'requesting' }
  | { phase: 'detected'; label: string; lat: number; lng: number }
  | { phase: 'denied' }
  | { phase: 'error' };

export function LocationSetupScreen({ navigation }: Props) {
  const [locState, setLocState] = useState<LocationState>({ phase: 'requesting' });
  const [manual, setManual] = useState('');
  const inputRef = useRef<TextInput>(null);

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
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  async function handleManualContinue() {
    const label = manual.trim();
    if (!label) return;
    Keyboard.dismiss();
    await setLocation({ label });
    await setHasSeenOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  async function handleSkip() {
    await setHasSeenOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  const canManualContinue = manual.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.hero}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.iconBadge}>
            <Feather name="map-pin" size={36} color="#FF6F91" />
          </View>
          <Text style={styles.title}>Where are you based?</Text>
          <Text style={styles.subtitle}>
            We'll show you the best services and businesses near you.
          </Text>
        </View>

        {/* Detected location card */}
        {locState.phase === 'requesting' && (
          <View style={styles.detectingCard}>
            <ActivityIndicator size="small" color={colors.textMuted} />
            <Text style={styles.detectingLabel}>Detecting your location…</Text>
          </View>
        )}

        {locState.phase === 'detected' && (
          <Pressable
            style={({ pressed }) => [styles.detectedCard, pressed && styles.detectedCardPressed]}
            onPress={() => void handleUseDetected()}
          >
            <View style={styles.detectedCardLeft}>
              <Feather name="navigation" size={18} color="#FF6F91" />
              <View>
                <Text style={styles.detectedCity}>{locState.label}</Text>
                <Text style={styles.detectedHint}>Tap to use this location</Text>
              </View>
            </View>
            <Feather name="check-circle" size={20} color="#4CAF50" />
          </Pressable>
        )}

        {(locState.phase === 'denied' || locState.phase === 'error') && (
          <Pressable style={styles.retryCard} onPress={() => void detectLocation()}>
            <Feather name="alert-circle" size={16} color={colors.textMuted} />
            <Text style={styles.retryLabel}>
              {locState.phase === 'denied'
                ? "Location access denied. Grant access in Settings or enter below."
                : "Couldn't detect location."}
            </Text>
            {locState.phase === 'error' && (
              <Text style={styles.retryAction}>Retry</Text>
            )}
          </Pressable>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual input */}
        <View style={styles.inputWrap}>
          <Feather name="map" size={16} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="City or neighbourhood, e.g. Lagos"
            placeholderTextColor={colors.textMuted}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void handleManualContinue()}
          />
        </View>

        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              !canManualContinue && styles.ctaDisabled,
              pressed && canManualContinue && { opacity: 0.85 },
            ]}
            onPress={() => void handleManualContinue()}
            disabled={!canManualContinue}
          >
            <Text style={styles.ctaLabel}>Confirm location</Text>
          </Pressable>

          <Pressable style={styles.skipBtn} onPress={() => void handleSkip()}>
            <Text style={styles.skipLabel}>Skip for now</Text>
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
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6F9122',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  detectingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#f8f8f8',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detectingLabel: {
    fontSize: typography.size.base,
    color: colors.textMuted,
  },
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#4CAF5044',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detectedCardPressed: {
    backgroundColor: '#f5fdf5',
  },
  detectedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  detectedCity: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  detectedHint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  retryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fafafa',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryLabel: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  retryAction: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.primary,
    paddingVertical: 14,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.disabled,
  },
  ctaLabel: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipLabel: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
