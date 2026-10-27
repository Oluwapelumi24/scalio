import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MainTabScreenProps } from '../navigation/types';
import type { AppUser } from '../lib/api';
import { getCurrentUser, signOut } from '../lib/session';
import { Avatar, EmptyState, ListGroup, ListRow, Page, PageHeader, PillTabs, SectionTitle } from '../components/ui';
import { makeStyles, useTheme, type ThemeMode } from '../theme';

type Props = MainTabScreenProps<'Profile'>;

/** Account, appearance and signing out. Guests can still change how the app looks. */
export function ProfileScreen({ navigation }: Props) {
  const { mode, setMode } = useTheme();
  const styles = useStyles();
  const [user, setUser] = useState<AppUser | null>(() => getCurrentUser());

  useFocusEffect(
    useCallback(() => {
      setUser(getCurrentUser());
    }, []),
  );

  const appearance = (
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
  );

  const previewOnboarding = async () => {
    await AsyncStorage.multiRemove(['scalio:hasSeenOnboarding', 'scalio:location']);
    navigation.navigate('Onboarding');
  };

  if (!user) {
    return (
      <Page>
        <PageHeader title="Profile" description="Sign in to see your bookings and saved places." />
        <EmptyState
          icon="user"
          title="Sign in to your account"
          body="Manage bookings, track appointments and more."
          action="Sign in"
          onAction={() => navigation.navigate('SignIn')}
        />
        {appearance}
        {__DEV__ ? (
          <ListGroup title="Developer">
            <ListRow icon="play" label="Preview onboarding" onPress={() => void previewOnboarding()} />
          </ListGroup>
        ) : null}
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Profile" description="Your account, bookings and how the app looks." />

      <View style={styles.profile}>
        <Avatar name={user.name} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
        </View>
      </View>

      {appearance}

      <ListGroup title="Your account">
        <ListRow icon="calendar" label="My bookings" onPress={() => navigation.navigate('Appointments')} />
        <ListRow icon="heart" label="Saved businesses" sublabel="Coming soon" />
        <ListRow icon="bell" label="Notifications" sublabel="Coming soon" />
        <ListRow icon="help-circle" label="Help and support" sublabel="Coming soon" />
      </ListGroup>

      <ListGroup title="Account">
        <ListRow
          icon="log-out"
          label="Sign out"
          trailing="none"
          danger
          onPress={() => {
            void signOut().then(() => setUser(null));
          }}
        />
      </ListGroup>

      {__DEV__ ? (
        <ListGroup title="Developer">
          <ListRow icon="play" label="Preview onboarding" onPress={() => void previewOnboarding()} />
        </ListGroup>
      ) : null}
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary },
}));
