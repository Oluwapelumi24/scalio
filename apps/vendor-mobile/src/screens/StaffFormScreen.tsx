import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createStaff, updateStaff } from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffForm'>;

const ROLES = ['staff', 'admin', 'owner'] as const;
type Role = (typeof ROLES)[number];

export function StaffFormScreen({ route, navigation }: Props) {
  const existing = route.params?.member;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [role, setRole] = useState<Role>((existing?.role as Role) ?? 'staff');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a name.'); return; }
    if (!email.trim()) { Alert.alert('Required', 'Please enter an email address.'); return; }
    if (!isEdit && !password.trim()) { Alert.alert('Required', 'Please enter a password.'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await updateStaff(existing.id, { name: name.trim(), role });
      } else {
        await createStaff({ name: name.trim(), email: email.trim(), password, role });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save staff member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.screenTitle}>{isEdit ? 'Edit staff member' : 'Add staff member'}</Text>
        <Text style={styles.subtitle}>{isEdit ? `Editing ${existing.name}` : 'Invite a new team member'}</Text>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Jane Smith"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Email — read-only when editing */}
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, isEdit && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              placeholder="jane@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isEdit}
            />
            {isEdit && <Text style={styles.fieldHint}>Email cannot be changed after creation.</Text>}
          </View>

          {/* Password — create only */}
          {!isEdit && (
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Set initial password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>
          )}

          {/* Role */}
          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.rolePill, role === r && styles.rolePillActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.rolePillLabel, role === r && styles.rolePillLabelActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldHint}>
              {role === 'owner'
                ? 'Full access including billing and team management.'
                : role === 'admin'
                ? 'Can manage bookings, services and customers.'
                : 'Can view and update bookings assigned to them.'}
            </Text>
          </View>

          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnLabel}>{isEdit ? 'Save changes' : 'Add staff member'}</Text>
            )}
          </Pressable>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: { marginTop: spacing.md, marginBottom: spacing.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: 2 },
  content: { padding: spacing.xl, gap: spacing.lg },
  field: { gap: spacing.sm },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    color: colors.textMuted,
  },
  fieldHint: { fontSize: typography.size.xs, color: colors.textMuted },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rolePillActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  rolePillLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  rolePillLabelActive: { color: colors.accent },
  saveBtn: {
    marginTop: spacing.md,
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.white },
});
