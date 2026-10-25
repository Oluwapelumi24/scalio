import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HubKey, RootStackParamList } from '../navigation/types';
import { getSession } from '../lib/session';
import { FEATURES, openFeature, type FeatureKey } from '../lib/features';
import { ListGroup, ListRow, Page, PageHeader, type FeatherName } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Hub'>;

interface Item {
  icon?: FeatherName;
  label: string;
  /** An advanced feature: opens its intro the first time. */
  feature?: FeatureKey;
  go?: () => void;
  /** Jumps to another part of the app (shown with ↗). */
  shortcut?: boolean;
  show?: boolean;
}

interface Group {
  title?: string;
  items: Item[];
}

const TITLES: Record<HubKey, { title: string; description: string }> = {
  marketing: { title: 'Marketing', description: 'Get found, bring clients back and answer every message.' },
  money: { title: 'Money', description: 'Sales, payments, salaries and expenses in one place.' },
  team: { title: 'Team', description: 'Your people, their hours and how they are doing.' },
};

/** One of the grouped menus behind the More tiles. */
export function HubScreen({ navigation, route }: Props) {
  const session = getSession();
  const role = session?.role;
  const isManager = role === 'owner' || role === 'manager';
  const feature = (k: FeatureKey): Item => ({ icon: FEATURES[k].icon, label: FEATURES[k].name, feature: k });

  const groups: Record<HubKey, Group[]> = {
    marketing: [
      {
        title: 'Promote',
        items: [
          { ...feature('content_studio'), show: role !== 'practitioner' },
          { ...feature('social_accounts'), show: role !== 'practitioner' },
          { ...feature('ads'), show: role !== 'practitioner' },
        ],
      },
      {
        title: 'Engage',
        items: [
          { icon: 'message-circle', label: 'Inbox', go: () => navigation.navigate('Inbox'), show: role !== 'practitioner' },
          feature('leads'),
          feature('feedback'),
        ],
      },
    ],
    money: [
      {
        items: [
          { icon: 'pie-chart', label: 'Money overview', go: () => navigation.navigate('Money') },
          { icon: 'bar-chart-2', label: 'Reports', go: () => navigation.navigate('Reports') },
          feature('payroll'),
          feature('online_payments'),
        ],
      },
    ],
    team: [
      {
        items: [
          { icon: 'users', label: 'Team members', go: () => navigation.navigate('StaffManagement'), show: isManager },
          {
            icon: 'clock',
            label: 'My working hours',
            go: () => session && navigation.navigate('StaffSchedule', { staffId: session.staffId, name: session.name }),
            show: !isManager,
          },
          { icon: 'log-in', label: 'Attendance', go: () => navigation.navigate('Attendance') },
          { icon: 'award', label: 'Performance', go: () => navigation.navigate('Performance'), show: role !== 'front_desk' },
        ],
      },
      {
        title: 'Shortcuts',
        items: [
          { label: 'Payroll', go: () => void openFeature(navigation, 'payroll'), shortcut: true, show: isManager },
          { label: 'Opening hours', go: () => navigation.navigate('BusinessHours'), shortcut: true, show: isManager },
        ],
      },
    ],
  };

  const { title, description } = TITLES[route.params.hub];

  return (
    <Page>
      <PageHeader title={title} description={description} onBack={() => navigation.goBack()} />
      {groups[route.params.hub].map((g, i) => {
        const items = g.items.filter((it) => it.show !== false);
        if (items.length === 0) return null;
        return (
          <View key={i}>
            <ListGroup title={g.title}>
              {items.map((it) => (
                <ListRow
                  key={it.label}
                  icon={it.icon}
                  label={it.label}
                  trailing={it.shortcut ? 'external' : 'chevron'}
                  onPress={it.feature ? () => void openFeature(navigation, it.feature!) : it.go}
                />
              ))}
            </ListGroup>
          </View>
        );
      })}
    </Page>
  );
}
