import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  formatDateTime,
  formatNaira,
  getHome,
  getTodaySummary,
  recordModuleUsage,
  type HomeItem,
  type HomeResponse,
  type TodaySummary,
} from '../lib/api';
import { openFeature } from '../lib/features';
import { Avatar, Button, EmptyState, Page, PageHeader, StatCard, type FeatherName } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

/** Plain-English line and button for each thing that needs the owner. */
const ATTENTION: Record<string, { text: (n: number) => string; action: string }> = {
  awaiting_payment: { text: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`, action: 'View' },
  starting_soon: { text: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`, action: 'View' },
  unassigned_today: { text: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no one assigned`, action: 'Assign' },
  bookings_on_leave: { text: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with someone on leave`, action: 'Review' },
  payroll_open: { text: (n) => `Payroll is open: ${n} ${n === 1 ? 'person' : 'people'} to pay`, action: 'Pay' },
  unhappy_customers: { text: (n) => `${n} unhappy ${n === 1 ? 'client' : 'clients'} to call back`, action: 'Call back' },
  leads_due: { text: (n) => `${n} ${n === 1 ? 'lead is' : 'leads are'} waiting for a follow-up`, action: 'Follow up' },
  posts_planned_today: { text: (n) => `${n} ${n === 1 ? 'post is' : 'posts are'} planned for today`, action: 'Open' },
};

function overviewValue(item: HomeItem): string {
  const d = item.data;
  if (typeof d.amountKobo === 'number') return formatNaira(d.amountKobo);
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`;
  if (item.id === 'customer_rating') return `${d.average}★ (${d.count})`;
  if (typeof d.count === 'number') return String(d.count);
  return '—';
}

/** The business at a glance: today, what needs you, what's next, and the longer view. */
export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [h, t] = await Promise.all([getHome(), getTodaySummary().catch(() => null)]);
      setHome(h);
      setToday(t);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function act(item: HomeItem) {
    recordModuleUsage(item.id);
    switch (item.id) {
      case 'payroll_open':
        return void openFeature(navigation, 'payroll');
      case 'unhappy_customers':
        return void openFeature(navigation, 'feedback');
      case 'leads_due':
        return navigation.navigate('Leads', { filter: 'due' });
      case 'posts_planned_today':
        return navigation.navigate('ContentStudio', { tab: 'planned' });
      default:
        return navigation.navigate('Bookings');
    }
  }

  const attention = home?.layers.attention.filter((i) => i.id in ATTENTION) ?? [];
  const upcoming = home?.bookings?.upcoming ?? [];
  const overview = home?.layers.overview.filter((i) => i.id !== 'upcoming_bookings') ?? [];

  return (
    <Page refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}>
      <PageHeader title="Dashboard" description={home?.business.name ? `How ${home.business.name} is doing.` : undefined} onBack={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator color={colors.link} />
      ) : !home ? (
        <EmptyState icon="wifi-off" title="Could not load your dashboard" body={error} action="Try again" onAction={() => { setLoading(true); void load(); }} />
      ) : (
        <>
          {today ? (
            <View style={styles.stats}>
              <View style={{ flex: 1 }}><StatCard label="Today" value={String(today.bookings)} sub={today.bookings === 1 ? 'booking' : 'bookings'} /></View>
              {today.salesKobo != null ? (
                <View style={{ flex: 1 }}><StatCard label="Sales today" value={formatNaira(today.salesKobo)} /></View>
              ) : null}
            </View>
          ) : null}

          <Card title="Needs your attention" subtitle="Right now">
            {attention.length === 0 ? (
              <Empty icon="check-circle" title="All clear" body="Nothing needs you right now." />
            ) : (
              attention.map((item) => (
                <View key={item.id} style={styles.alert}>
                  <View style={styles.flag} />
                  <Text style={styles.alertText}>{ATTENTION[item.id].text(item.data.count ?? item.data.toPay)}</Text>
                  <Button label={ATTENTION[item.id].action} size="sm" onPress={() => act(item)} />
                </View>
              ))
            )}
          </Card>

          <Card title="Upcoming bookings" subtitle="Next few" action="All bookings" onAction={() => navigation.navigate('Bookings')}>
            {upcoming.length === 0 ? (
              <Empty icon="calendar" title="Your schedule is empty" body="New bookings show up here as soon as clients make them." />
            ) : (
              upcoming.map((b) => (
                <Pressable key={b.id} style={styles.person} onPress={() => navigation.navigate('Bookings')} accessibilityRole="button">
                  <Avatar name={b.customerName ?? 'Client'} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName} numberOfLines={1}>{b.customerName ?? 'Client'}</Text>
                    <Text style={styles.personSub}>
                      {formatDateTime(b.scheduledAt)}
                      {b.status === 'pending_payment' ? ' · waiting for payment' : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.text} />
                </Pressable>
              ))
            )}
          </Card>

          {overview.length > 0 ? (
            <Card title="Your business" subtitle="Last 30 days">
              {overview.map((item) => (
                <View key={item.id} style={styles.metric}>
                  <Feather name={item.icon as FeatherName} size={20} color={colors.textSecondary} />
                  <Text style={styles.metricLabel}>{item.title}</Text>
                  <Text style={styles.metricValue}>{overviewValue(item)}</Text>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </Page>
  );
}

function Card({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
        </View>
        {action && onAction ? <Text style={styles.link} onPress={onAction}>{action}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Empty({ icon, title, body }: { icon: FeatherName; title: string; body: string }) {
  return <EmptyState icon={icon} title={title} body={body} boxed={false} />;
}

const useStyles = makeStyles((colors) => ({
  stats: { flexDirection: 'row', gap: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 22, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  link: { fontSize: 14, fontWeight: '600', color: colors.link },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  flag: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.warning },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
  person: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  personName: { fontSize: 15, fontWeight: '600', color: colors.text },
  personSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  metricLabel: { flex: 1, fontSize: 14, color: colors.text },
  metricValue: { fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
}));
