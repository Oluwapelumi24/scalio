import { useState } from 'react';
import { Image, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CATEGORY_META } from '../lib/categories';
import { INTERESTS, type Interest } from '../lib/interests';
import { setInterests } from '../lib/preferences';
import { Button, IconButton } from '../components/ui';
import { makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestSelection'>;

// Massage stays a category elsewhere; leaving it out here gives an even 4 × 3 grid.
const PICKS = INTERESTS.filter((i) => i !== 'Massage');

// Every pick fits on one screen. The grid measures the space between the
// subtitle and the button and its rows fill it from top to bottom.
const SIDE = 20;
const GAP = 10;
const LABEL_H = 34; // two lines of label under each tile
const MIN_ROW_GAP = 10;
const PAD_Y = 12; // breathing room above the first row and below the last

/** Largest tile for `cols` columns in a w × h area, and the rows it needs. */
function layoutFor(cols: number, w: number, h: number) {
  const rows = Math.ceil(PICKS.length / cols);
  const byWidth = (w - SIDE * 2 - GAP * (cols - 1)) / cols;
  const byHeight = (h - PAD_Y * 2 - rows * LABEL_H - (rows - 1) * MIN_ROW_GAP) / rows;
  return { cols, rows, size: Math.floor(Math.max(48, Math.min(byWidth, byHeight))) };
}

/** Onboarding steps after the intro: interests, location, account. */
const STEPS = 3;

function InterestTile({
  item,
  size,
  selected,
  onToggle,
}: {
  item: Interest;
  size: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const meta = CATEGORY_META[item];
  const [imgError, setImgError] = useState(false);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={item}
      style={({ pressed }) => [{ width: size }, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.tile, { width: size, height: size }, selected && styles.tileOn]}>
        {imgError ? (
          <View style={[styles.fallback, { backgroundColor: meta.color }]}>
            <Feather name={meta.icon} size={size * 0.34} color={colors.white} />
          </View>
        ) : (
          <Image
            // Bundled photos aren't plain numbers on web, so only wrap real URL strings
            source={typeof meta.image === 'string' ? { uri: meta.image } : meta.image}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        )}
        {selected ? (
          <View style={styles.check}>
            <Feather name="check" size={14} color={colors.onAccent} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, selected && styles.labelOn]} numberOfLines={2}>{item}</Text>
    </Pressable>
  );
}

export function InterestSelectionScreen({ navigation }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);

  function onGridLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (!area || Math.abs(area.w - w) > 1 || Math.abs(area.h - h) > 1) setArea({ w, h });
  }

  // 3 × 4 or 4 × 3, whichever gives bigger tiles in the measured space.
  const layout = area
    ? [layoutFor(3, area.w, area.h), layoutFor(4, area.w, area.h)].reduce((a, b) => (b.size > a.size ? b : a))
    : null;
  const rows = layout
    ? Array.from({ length: layout.rows }, (_, r) => PICKS.slice(r * layout.cols, (r + 1) * layout.cols))
    : [];

  function toggle(interest: string) {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function handleContinue() {
    if (selected.length === 0) return;
    await setInterests(selected);
    navigation.navigate('LocationSetup');
  }

  const canContinue = selected.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.back}>
          <IconButton icon="arrow-left" label="Back" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.dots} accessibilityLabel={`Step 1 of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotOn]} />
          ))}
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.title} accessibilityRole="header">What are you into?</Text>
        <Text style={styles.subtitle}>Pick a few to personalise your home feed</Text>
      </View>

      {/* Rows spread from just under the subtitle to just above the button */}
      <View style={styles.gridArea} onLayout={onGridLayout}>
        {layout
          ? rows.map((row, r) => (
              <View key={r} style={styles.row}>
                {row.map((item) => (
                  <InterestTile
                    key={item}
                    item={item}
                    size={layout.size}
                    selected={selected.includes(item)}
                    onToggle={() => toggle(item)}
                  />
                ))}
              </View>
            ))
          : null}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          label={canContinue ? `Continue (${selected.length})` : 'Pick at least one'}
          onPress={() => void handleContinue()}
          disabled={!canContinue}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 56, justifyContent: 'center', alignItems: 'center' },
  back: { position: 'absolute', left: SIDE - 10, top: 6 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotOn: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.text },
  intro: { alignItems: 'center', gap: 6, paddingHorizontal: SIDE, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 21, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, textAlign: 'center' },
  gridArea: { flex: 1, justifyContent: 'space-between', paddingHorizontal: SIDE, paddingVertical: PAD_Y },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface,
    borderWidth: 3, borderColor: colors.background,
  },
  tileOn: { borderColor: colors.accent },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: {
    position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 7,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  label: { marginTop: 6, height: LABEL_H - 6, fontSize: 12, lineHeight: 14, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },
  labelOn: { color: colors.text, fontWeight: '700' },
  footer: { paddingHorizontal: SIDE, paddingTop: spacing.md },
}));
