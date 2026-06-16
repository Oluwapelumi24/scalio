import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabScreenProps } from '../navigation/types';
import type { AppUser } from '../lib/api';
import { getCurrentUser, signOut } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = MainTabScreenProps<'Profile'>;

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuRow({ icon, label, onPress, danger }: MenuItem) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Feather name={icon} size={18} color={danger ? colors.error : colors.textBody} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {!danger && <Feather name="chevron-right" size={18} color={colors.disabled} />}
    </Pressable>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<AppUser | null>(() => getCurrentUser());

  useFocusEffect(
    useCallback(() => {
      setUser(getCurrentUser());
    }, []),
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.guestState}>
          <View style={styles.guestAvatar}>
            <Feather name="user" size={36} color={colors.disabled} />
          </View>
          <Text style={styles.guestHeadline}>Sign in to your account</Text>
          <Text style={styles.guestSub}>Manage bookings, track appointments, and more.</Text>
          <Pressable style={styles.signInBtn} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signInBtnLabel}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const menuItems: MenuItem[] = [
    {
      icon: 'calendar',
      label: 'My bookings',
      onPress: () => navigation.navigate('Appointments'),
    },
    {
      icon: 'heart',
      label: 'Saved businesses',
      onPress: () => {},
    },
    {
      icon: 'bell',
      label: 'Notifications',
      onPress: () => {},
    },
    {
      icon: 'settings',
      label: 'Settings',
      onPress: () => {},
    },
    {
      icon: 'help-circle',
      label: 'Help & Support',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar card */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <Pressable style={styles.editBtn}>
          <Feather name="edit-2" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Menu items */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <MenuRow key={item.label} {...item} />
        ))}
      </View>

      {/* Sign out */}
      <View style={[styles.menuSection, { marginTop: spacing.md }]}>
        <MenuRow
          icon="log-out"
          label="Sign out"
          danger
          onPress={() => {
            signOut();
            setUser(null);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  guestState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  guestHeadline: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
    marginTop: spacing.sm,
  },
  signInBtnLabel: {
    color: '#ffffff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: typography.weight.bold,
  },
  avatarInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  userEmail: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: '#fff0f0',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  menuLabelDanger: {
    color: colors.error,
  },
});
