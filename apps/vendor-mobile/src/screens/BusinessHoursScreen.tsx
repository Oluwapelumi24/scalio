import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getBusinessHours, setBusinessHours, type BusinessHours } from '../lib/api';
import { Button, Page, PageHeader, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessHours'>;

// Monday first, the way people read a week.
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS: BusinessHours[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: i === 0,
}));

/** Every half hour, for the time picker. */
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

export function BusinessHoursScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [hours, setHours] = useState<BusinessHours[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getBusinessHours();
      if (data.length > 0) setHours(DEFAULT_HOURS.map((d) => data.find((h) => h.dayOfWeek === d.dayOfWeek) ?? d));
    } catch {
      // Keep the defaults.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function update(dayOfWeek: number, patch: Partial<BusinessHours>) {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)));
  }

  async function handleSave() {
    const bad = hours.find((h) => !h.isClosed && h.closeTime <= h.openTime);
    if (bad) {
      Alert.alert('Check your hours', `On ${DAYS[bad.dayOfWeek]}, closing time must be after opening time.`);
      return;
    }
    setSaving(true);
    try {
      await setBusinessHours(hours);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save your hours', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const day = editing != null ? hours.find((h) => h.dayOfWeek === editing)! : null;

  return (
    <Page
      footer={
        <StickyFooter>
          <Button label="Save" onPress={() => void handleSave()} loading={saving} disabled={loading} style={{ flex: 1 }} />
        </StickyFooter>
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        title="Opening hours"
        description="When clients can book you. Your calendar shades the hours you are closed."
      />

      {loading ? (
        <ActivityIndicator color={colors.link} />
      ) : (
        <View>
          {ORDER.map((d) => {
            const h = hours.find((x) => x.dayOfWeek === d)!;
            const open = !h.isClosed;
            return (
              <View key={d} style={styles.day}>
                <Pressable
                  onPress={() => update(d, { isClosed: open })}
                  style={[styles.check, open && styles.checkOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: open }}
                  accessibilityLabel={`Open on ${DAYS[d]}`}
                  hitSlop={8}
                >
                  {open ? <Feather name="check" size={18} color={colors.onAccent} /> : null}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName}>{DAYS[d]}</Text>
                  <Text style={[styles.state, { color: open ? colors.success : colors.textMuted }]}>{open ? 'Open' : 'Closed'}</Text>
                </View>
                {open ? (
                  <Pressable onPress={() => setEditing(d)} accessibilityRole="button" accessibilityLabel={`Change hours for ${DAYS[d]}`} hitSlop={8}>
                    <Text style={styles.times}>{h.openTime} – {h.closeTime}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={day != null} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.overlay} onPress={() => setEditing(null)} accessibilityLabel="Close" />
        {day ? (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{DAYS[day.dayOfWeek]}</Text>
            <View style={styles.pickers}>
              {(['openTime', 'closeTime'] as const).map((k) => (
                <View key={k} style={{ flex: 1, gap: 8 }}>
                  <Text style={styles.pickerLabel}>{k === 'openTime' ? 'Opens' : 'Closes'}</Text>
                  <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                    {TIMES.map((t) => {
                      const on = day[k] === t;
                      return (
                        <Pressable key={t} onPress={() => update(day.dayOfWeek, { [k]: t })} style={[styles.time, on && styles.timeOn]} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                          <Text style={[styles.timeText, on && { color: colors.onPrimary }]}>{t}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
            <Button label="Done" onPress={() => setEditing(null)} />
          </View>
        ) : null}
      </Modal>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  day: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  check: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayName: { fontSize: 18, color: colors.text },
  state: { fontSize: 15, marginTop: 2 },
  times: { fontSize: 18, color: colors.link, fontVariant: ['tabular-nums'] },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: GUTTER, paddingTop: 10, gap: 14 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  sheetTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  pickers: { flexDirection: 'row', gap: 16 },
  pickerLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  picker: { height: 260 },
  time: { height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  timeOn: { backgroundColor: colors.primary },
  timeText: { fontSize: 17, color: colors.text, fontVariant: ['tabular-nums'] },
}));
