import { Pressable, StyleSheet, Text } from 'react-native';

export function BackButton({ onPress, color = '#111111' }: { onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.button} hitSlop={8}>
      <Text style={[styles.label, { color }]}>‹ Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
