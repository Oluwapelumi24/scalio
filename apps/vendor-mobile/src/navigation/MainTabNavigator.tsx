import { useState } from 'react';
import { Modal, Pressable, Share, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList, RootStackParamList } from './types';
import { BookingHomeScreen } from '../screens/BookingHomeScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { getSession } from '../lib/session';
import { useSetupStatus } from '../lib/setup';
import { recordModuleUsage } from '../lib/api';
import type { FeatherName } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Never shown: the + tab only opens the create sheet. */
function Nothing() {
  return null;
}

const ICONS: Partial<Record<keyof MainTabParamList, FeatherName>> = {
  Home: 'home',
  Customers: 'users',
  InboxTab: 'message-circle',
  More: 'grid',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Customers: 'Clients',
  Create: 'Create',
  InboxTab: 'Inbox',
  More: 'More',
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(false);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const name = route.name as keyof MainTabParamList;
        const focused = state.index === index;
        if (name === 'Create') {
          return (
            <View key={route.key} style={styles.tab}>
              <Pressable
                onPress={() => setSheet(true)}
                accessibilityRole="button"
                accessibilityLabel="Create: new booking and more"
                style={({ pressed }) => [styles.plus, pressed && { opacity: 0.85 }]}
              >
                <Feather name="plus" size={30} color={colors.onAccent} />
              </Pressable>
            </View>
          );
        }
        const color = focused ? colors.link : colors.text;
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[name]}
          >
            <Feather name={ICONS[name]!} size={28} color={color} />
          </Pressable>
        );
      })}
      <CreateSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

/** What the + button can make. */
function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setup = useSetupStatus();
  const role = getSession()?.role;
  const isManager = role === 'owner' || role === 'manager';

  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const items: { icon: FeatherName; label: string; sub: string; onPress: () => void; show: boolean }[] = [
    { icon: 'calendar', label: 'New booking', sub: 'A walk-in, a call or a message', onPress: () => navigation.navigate('NewBooking'), show: true },
    {
      icon: 'share-2',
      label: 'Share booking link',
      sub: 'Let clients book themselves',
      onPress: () => {
        if (!setup?.link) return;
        recordModuleUsage('share_booking_link');
        void Share.share({ message: `Book an appointment with us on Scalio: ${setup.link}` });
      },
      show: !!setup?.link,
    },
    { icon: 'slash', label: 'Block a day off', sub: 'Close for a holiday or event', onPress: () => navigation.navigate('BlackoutDates'), show: isManager },
    { icon: 'scissors', label: 'Add a service', sub: 'Something clients can book', onPress: () => navigation.navigate('ServiceForm', {}), show: isManager },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <Text style={styles.sheetTitle}>Create</Text>
        {items.filter((i) => i.show).map((i) => (
          <Pressable
            key={i.label}
            onPress={go(i.onPress)}
            accessibilityRole="button"
            accessibilityLabel={`${i.label}. ${i.sub}`}
            style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.surface }]}
          >
            <View style={styles.sheetIcon}>
              <Feather name={i.icon} size={22} color={colors.link} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetLabel}>{i.label}</Text>
              <Text style={styles.sheetSub}>{i.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

export function MainTabNavigator() {
  // Practitioners work from their own calendar: no business inbox or client list.
  const isPractitioner = getSession()?.role === 'practitioner';
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={BookingHomeScreen} />
      {isPractitioner ? null : <Tab.Screen name="Customers" component={CustomersScreen} />}
      <Tab.Screen name="Create" component={Nothing} />
      {!isPractitioner ? <Tab.Screen name="InboxTab" component={InboxScreen} /> : null}
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const useStyles = makeStyles((colors) => ({
  tabBar: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 10,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52 },
  plus: { width: 72, height: 50, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: GUTTER - 8, paddingTop: 10, gap: 2,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 14 },
  sheetTitle: { fontSize: 19, fontWeight: '700', color: colors.text, paddingHorizontal: 8, marginBottom: 10 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 16 },
  sheetIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  sheetSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
}));
