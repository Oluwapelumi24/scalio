import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listStaff, deleteStaff, type StaffMember } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffManagement'>;

const ROLE_COLOR: Record<string, string> = {
  owner: colors.primary,
  admin: '#7c3aed',
  staff: colors.accent,
};

function RoleBadge({ role }: { role: string }) {
  const bg = ROLE_COLOR[role] ?? colors.textSecondary;
  return (
    <View style={[styles.roleBadge, { backgroundColor: bg }]}>
      <Text style={styles.roleLabel}>{role}</Text>
    </View>
  );
}

export function StaffManagementScreen({ navigation }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setStaff(await listStaff());
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function confirmDelete(member: StaffMember) {
    Alert.alert(
      'Remove staff member',
      `Remove ${member.name} from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaff(member.id);
              setStaff((prev) => prev.filter((m) => m.id !== member.id));
            } catch {
              Alert.alert('Error', 'Could not remove staff member.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('StaffForm', {})}
          >
            <Feather name="plus" size={16} color={colors.white} />
            <Text style={styles.addBtnLabel}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.screenTitle}>Staff management</Text>
        <Text style={styles.subtitle}>Manage your team and their roles</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                <RoleBadge role={item.role} />
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate('StaffForm', { member: item })}
                  hitSlop={8}
                >
                  <Feather name="edit-2" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => confirmDelete(item)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.error} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No staff members yet</Text>
              <Pressable
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('StaffForm', {})}
              >
                <Text style={styles.emptyAddLabel}>Add first member</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerSafe: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addBtnLabel: { color: colors.white, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  screenTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.xl, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
  info: { flex: 1, gap: spacing.xs },
  name: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.text },
  email: { fontSize: typography.size.sm, color: colors.textMuted },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  roleLabel: { fontSize: typography.size.xs, color: colors.white, fontWeight: typography.weight.semibold, textTransform: 'capitalize' },
  actions: { gap: spacing.sm },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.lg },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
  emptyAddBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyAddLabel: { color: colors.white, fontWeight: typography.weight.semibold, fontSize: typography.size.base },
});
