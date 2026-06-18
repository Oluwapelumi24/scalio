import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { clearSession, getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, danger ? styles.rowIconDanger : {}]}>
        <Feather name={icon} size={18} color={danger ? colors.error : colors.textSecondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger ? styles.rowLabelDanger : {}]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const session = getSession();

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          navigation.replace('Login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(session?.name ?? 'V').charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{session?.name ?? '—'}</Text>
          <Text style={styles.profileEmail}>{session?.email ?? '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleLabel}>{session?.role ?? 'staff'}</Text>
          </View>
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="briefcase"
            label="Manage services"
            subtitle="Add, edit or remove services"
            onPress={() => navigation.navigate('Services')}
          />
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="clock"
            label="Business hours"
            subtitle="Set your opening and closing times"
            onPress={() => navigation.navigate('BusinessHours')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="calendar"
            label="Blackout dates"
            subtitle="Block off dates you're unavailable"
            onPress={() => navigation.navigate('BlackoutDates')}
          />
        </View>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="users"
            label="Staff management"
            subtitle="Manage team members and roles"
            onPress={() => navigation.navigate('StaffManagement')}
          />
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="log-out"
            label="Sign out"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <View style={{ height: spacing.xxxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: 96,
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: { fontSize: 24, fontWeight: typography.weight.bold, color: colors.white },
  profileName: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
  profileEmail: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleLabel: { fontSize: typography.size.xs, color: colors.white, fontWeight: typography.weight.semibold, textTransform: 'capitalize' },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  group: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconDanger: { backgroundColor: colors.errorLight },
  rowText: { flex: 1 },
  rowLabel: { fontSize: typography.size.base, fontWeight: typography.weight.medium, color: colors.text },
  rowLabelDanger: { color: colors.error },
  rowSubtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 68 },
});
