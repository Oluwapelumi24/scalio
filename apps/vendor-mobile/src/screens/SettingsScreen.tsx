import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { clearSession, getSession } from '../lib/session';
import { openFeature } from '../lib/features';
import { Avatar, ListGroup, ListRow, Page, PageHeader, PillTabs, SectionTitle } from '../components/ui';
import { makeStyles, useTheme, type ThemeMode } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const ROLE: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front desk',
};

/** Profile, appearance, the business basics and signing out. Advanced features live under More. */
export function SettingsScreen({ navigation }: Props) {
  const { mode, setMode } = useTheme();
  const styles = useStyles();
  const session = getSession();
  const isManager = session?.role === 'owner' || session?.role === 'manager';

  function signOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  return (
    <Page>
      <PageHeader title="Settings" description="Your profile, how the app looks and how your business runs." onBack={() => navigation.goBack()} />

      <View style={styles.profile}>
        <Avatar name={session?.name ?? 'You'} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{session?.name ?? '—'}</Text>
          <Text style={styles.email} numberOfLines={1}>{session?.email ?? '—'}</Text>
          <Text style={styles.role}>{ROLE[session?.role ?? ''] ?? session?.role}</Text>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <SectionTitle title="Appearance" />
        <PillTabs<ThemeMode>
          options={[
            { key: 'system', label: 'Match phone' },
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      {isManager ? (
        <ListGroup title="Business">
          <ListRow icon="book-open" label="Services" onPress={() => navigation.navigate('Services')} />
          <ListRow icon="clock" label="Opening hours" onPress={() => navigation.navigate('BusinessHours')} />
          <ListRow icon="slash" label="Days off" onPress={() => navigation.navigate('BlackoutDates')} />
          <ListRow icon="shield" label="Online payments" onPress={() => void openFeature(navigation, 'online_payments')} />
          <ListRow icon="users" label="Team members" onPress={() => navigation.navigate('StaffManagement')} />
          <ListRow icon="sliders" label="What you want help with" onPress={() => navigation.navigate('InterestSelection', { fromSettings: true })} />
        </ListGroup>
      ) : (
        <ListGroup title="Your work">
          {session ? (
            <ListRow
              icon="clock"
              label="My working hours"
              onPress={() => navigation.navigate('StaffSchedule', { staffId: session.staffId, name: session.name })}
            />
          ) : null}
          <ListRow icon="log-in" label="Attendance" onPress={() => navigation.navigate('Attendance')} />
        </ListGroup>
      )}

      <ListGroup title="Account">
        <ListRow icon="log-out" label="Sign out" trailing="none" danger onPress={signOut} />
      </ListGroup>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary },
  role: { fontSize: 13, fontWeight: '600', color: colors.link, marginTop: 4 },
}));
