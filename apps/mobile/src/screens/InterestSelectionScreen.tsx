import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { INTERESTS } from '../lib/interests';
import { setHasSeenOnboarding, setInterests } from '../lib/preferences';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestSelection'>;

export function InterestSelectionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(interest: string) {
    setSelected((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  }

  async function handleContinue() {
    await setInterests(selected);
    await setHasSeenOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick a few things you love — we&apos;ll use them to tailor what you see first. You can change this
          anytime.
        </Text>
      </View>

      <View style={styles.chips}>
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <Pressable
              key={interest}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(interest)}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{interest}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.cta} onPress={() => void handleContinue()}>
        <Text style={styles.ctaLabel}>{selected.length === 0 ? 'Skip for now' : 'Continue'}</Text>
      </Pressable>
    </View>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 32,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dddddd',
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  cta: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
