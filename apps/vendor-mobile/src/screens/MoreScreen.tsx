import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { getSession } from '../lib/session';
import { useSetupStatus } from '../lib/setup';
import { recordModuleUsage } from '../lib/api';
import { TabFrame } from '../components/TabFrame';
import { Avatar, ListGroup, ListRow, type FeatherName } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'More'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface Tile {
  key: string;
  icon: FeatherName;
  label: string;
  onPress: () => void;
  show: boolean;
}

/**
 * Everything beyond the day's bookings: a grid of plain tiles, each opening a
 * screen or a grouped menu. This is where the advanced features live.
 */
export function MoreScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const session = getSession();
  const setup = useSetupStatus();
  const role = session?.role;
  const isManager = role === 'owner' || role === 'manager';

  const tiles: Tile[] = [
    { key: 'calendar', icon: 'calendar', label: 'Calendar', onPress: () => navigation.navigate('Calendar'), show: true },
    { key: 'dashboard', icon: 'bar-chart-2', label: 'Dashboard', onPress: () => navigation.navigate('Dashboard'), show: true },
    { key: 'services', icon: 'book-open', label: 'Services', onPress: () => navigation.navigate('Services'), show: isManager },
    { key: 'team', icon: 'users', label: 'Team', onPress: () => navigation.navigate('Hub', { hub: 'team' }), show: true },
    { key: 'marketing', icon: 'volume-2', label: 'Marketing', onPress: () => navigation.navigate('Hub', { hub: 'marketing' }), show: true },
    { key: 'money', icon: 'credit-card', label: 'Money', onPress: () => navigation.navigate('Hub', { hub: 'money' }), show: isManager },
    { key: 'reports', icon: 'trending-up', label: 'Reports', onPress: () => navigation.navigate('Reports'), show: isManager },
    { key: 'settings', icon: 'settings', label: 'Settings', onPress: () => navigation.navigate('Settings'), show: true },
  ];

  return (
    <TabFrame>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">More</Text>
        <Pressable onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Settings and profile">
          <Avatar name={session?.name ?? 'You'} size={44} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {tiles.filter((t) => t.show).map((t) => (
            <Pressable
              key={t.key}
              onPress={t.onPress}
              accessibilityRole="button"
              style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.surface }]}
            >
              <Feather name={t.icon} size={28} color={colors.text} />
              <Text style={styles.tileLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ListGroup>
          {setup?.link ? (
            <ListRow
              icon="link"
              label="Share your booking link"
              sublabel={setup.link.replace(/^https?:\/\//, '')}
              trailing={<Feather name="share" size={20} color={colors.text} />}
              onPress={() => {
                recordModuleUsage('share_booking_link');
                void Share.share({ message: `Book an appointment with us on Scalio: ${setup.link}` });
              }}
            />
          ) : null}
          {isManager && setup && !setup.ready ? (
            <ListRow icon="zap" label="Continue setup" sublabel="A few steps and clients can book you" onPress={() => navigation.navigate('Setup')} />
          ) : null}
          {role !== 'front_desk' ? (
            <ListRow icon="award" label="Performance insights" onPress={() => navigation.navigate('Performance')} />
          ) : null}
        </ListGroup>
      </ScrollView>
    </TabFrame>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6, color: colors.text },
  content: { paddingHorizontal: GUTTER, paddingBottom: 40, gap: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: {
    width: '47.8%', minHeight: 116, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, padding: 20, justifyContent: 'space-between',
  },
  tileLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
}));
