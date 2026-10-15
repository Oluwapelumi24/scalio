import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { clockIn, clockOut, getMyShift, getTeamShifts, formatTime, type ShiftStatus, type TeamShiftStatus } from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Attendance'>;

function since(iso: string | null) {
  return iso ? `since ${formatTime(iso)}` : '';
}

export function AttendanceScreen({ navigation }: Props) {
  const session = getSession();
  const isManager = session?.role === 'owner' || session?.role === 'manager';
  const [me, setMe] = useState<ShiftStatus | null>(null);
  const [team, setTeam] = useState<TeamShiftStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [mine, everyone] = await Promise.all([getMyShift(), isManager ? getTeamShifts() : Promise.resolve([])]);
      setMe(mine);
      setTeam(everyone.filter((m) => m.id !== session?.staffId));
    } catch (err) {
      Alert.alert('Could not load attendance', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isManager, session?.staffId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function toggle(staffId: string | undefined, clockedIn: boolean) {
    setBusy(staffId ?? 'me');
    try {
      if (clockedIn) await clockOut(staffId);
      else await clockIn(staffId);
      await load();
    } catch (err) {
      Alert.alert('Could not update', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Clock in when you start work and out when you finish.</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        >
          <View style={styles.meCard}>
            <View style={[styles.dot, { backgroundColor: me?.clockedIn ? colors.success : colors.disabled }]} />
            <Text style={styles.meStatus}>{me?.clockedIn ? `You're clocked in ${since(me.since)}` : "You're not clocked in"}</Text>
            <Pressable
              style={[styles.bigBtn, me?.clockedIn && styles.bigBtnOut, busy === 'me' && { opacity: 0.6 }]}
              onPress={() => toggle(undefined, !!me?.clockedIn)}
              disabled={busy !== null}
              accessibilityRole="button"
            >
              {busy === 'me' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Feather name={me?.clockedIn ? 'log-out' : 'log-in'} size={18} color={colors.white} />
                  <Text style={styles.bigBtnLabel}>{me?.clockedIn ? 'Clock out' : 'Clock in'}</Text>
                </>
              )}
            </Pressable>
          </View>

          {isManager && team.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Your team today</Text>
              <Text style={styles.hint}>You can clock someone in or out if they forget.</Text>
              <View style={styles.card}>
                {team.map((m, i) => (
                  <View key={m.id} style={[styles.row, i > 0 && styles.divider]}>
                    <View style={[styles.dot, { backgroundColor: m.clockedIn ? colors.success : colors.disabled }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{m.name}</Text>
                      <Text style={styles.meta}>{m.clockedIn ? `Clocked in ${since(m.since)}` : 'Not clocked in'}</Text>
                    </View>
                    <Pressable
                      onPress={() => toggle(m.id, m.clockedIn)}
                      disabled={busy !== null}
                      style={styles.smallBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.clockedIn ? 'Clock out' : 'Clock in'} ${m.name}`}
                    >
                      {busy === m.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Text style={styles.smallBtnLabel}>{m.clockedIn ? 'Clock out' : 'Clock in'}</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  meCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  meStatus: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
  },
  bigBtnOut: { backgroundColor: colors.primary },
  bigBtnLabel: { color: colors.white, fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text, marginTop: spacing.xxl },
  hint: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  card: { backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  smallBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, minWidth: 84, alignItems: 'center' },
  smallBtnLabel: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
});
