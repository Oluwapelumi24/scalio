import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { formatDateTime, getHome, recordModuleUsage, type HomeItem, type HomeResponse } from '../lib/api';
import { getSession } from '../lib/session';
import type { FeatherName } from '../components/ui';
import { GUTTER, makeStyles, radius, spacing, useTheme } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Home is about bookings and nothing else. Alerts about bookings show here; the
 * rest (payroll, leads, posts, feedback) is counted once and lives in More.
 */
const BOOKING_ALERTS: Record<string, { text: (n: number) => string; action: string }> = {
  awaiting_payment: { text: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`, action: 'View' },
  starting_soon: { text: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`, action: 'View' },
  unassigned_today: { text: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff`, action: 'Assign' },
  bookings_on_leave: { text: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`, action: 'Review' },
};

interface SetupStep { key: string; label: string; hint: string; icon: FeatherName; done: boolean; onPress: () => void }

function SectionHeading({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      {link && onLink ? (
        <Pressable onPress={onLink} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionLink}>{link}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The booking-first home, in Scalio's own look: blue wash header, booking link, what's next. */
export function BookingHomeScreen({ navigation }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const session = getSession();
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setHome(await getHome());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever Home comes back into view — set-up may have changed.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const isManager = session?.role === 'owner' || session?.role === 'manager';
  const firstName = (session?.name ?? '').split(' ')[0] || 'there';

  const bookings = home?.bookings;
  const alerts = home?.layers.attention.filter((i) => i.id in BOOKING_ALERTS) ?? [];
  const otherUpdates = (home?.layers.attention.length ?? 0) - alerts.length;

  // Only what stops customers booking. Payments are optional, and only managers can set them up.
  const steps: SetupStep[] = bookings
    ? [
        { key: 'services', label: 'Add a service', hint: 'Customers pick one when they book', icon: 'scissors', done: bookings.setup.services, onPress: () => navigation.navigate('ServiceForm', {}) },
        { key: 'hours', label: 'Set your opening hours', hint: 'So customers only book when you’re open', icon: 'clock', done: bookings.setup.hours, onPress: () => navigation.navigate('BusinessHours') },
        ...(isManager
          ? [{ key: 'payments', label: 'Take deposits online', hint: 'Optional — cuts no-shows', icon: 'credit-card' as FeatherName, done: bookings.setup.payments, onPress: () => navigation.navigate('PaymentsSetup') }]
          : []),
      ]
    : [];
  const ready = !!bookings && bookings.setup.services && bookings.setup.hours;

  function openAlert(item: HomeItem) {
    recordModuleUsage(item.id);
    navigation.navigate('Bookings');
  }

  function shareLink() {
    if (!bookings) return;
    recordModuleUsage('share_booking_link');
    void Share.share({ message: `Book an appointment with us on Scalio: ${bookings.link}` });
  }

  async function copyLink() {
    if (!bookings) return;
    await Clipboard.setStringAsync(bookings.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const upcomingCount = bookings?.upcoming.length ?? 0;
  const summary = !bookings
    ? ''
    : !ready
      ? 'A couple of steps and customers can book you.'
      : upcomingCount === 0
        ? 'No bookings coming up yet.'
        : `You have ${upcomingCount} ${upcomingCount === 1 ? 'booking' : 'bookings'} coming up.`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: soft Scalio-blue wash fading into the page */}
      <LinearGradient
        colors={scheme === 'dark' ? ['#16204a', '#101530', colors.background] : [colors.accentLight, colors.sky, colors.background]}
        locations={[0, 0.55, 1]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{(home?.business.name ?? 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.bizName} numberOfLines={1}>{home?.business.name ?? 'Your business'}</Text>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Text style={styles.avatarText}>{(session?.name ?? 'V').slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hey, {firstName}</Text>
        {summary ? <Text style={styles.greetingSub}>{summary}</Text> : null}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.xxl }} color={colors.link} />
      ) : !home || !bookings ? (
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={26} color={colors.textMuted} />
          <Text style={styles.metaText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.sectionLink}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          {ready ? (
            /* The one thing that brings in bookings: the link */
            <View style={styles.section}>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Feather name="calendar" size={22} color={colors.onDark} />
                </View>
                <Text style={styles.heroTitle}>{bookings.total === 0 ? 'Get your first booking' : 'Get more bookings'}</Text>
                <Text style={styles.heroBody}>Customers book and pay through your link. Share it on WhatsApp, Instagram or in your bio.</Text>
                <Pressable style={styles.linkPill} onPress={copyLink} accessibilityRole="button" accessibilityLabel="Copy booking link">
                  <Text style={styles.linkText} numberOfLines={1}>{bookings.link.replace(/^https?:\/\//, '')}</Text>
                  <Feather name={copied ? 'check' : 'copy'} size={15} color={colors.onDark} />
                </Pressable>
                <Pressable style={styles.heroBtn} onPress={shareLink} accessibilityRole="button">
                  <Feather name="share-2" size={16} color="#1e3a8a" />
                  <Text style={styles.heroBtnText}>Share booking link</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Not bookable yet: only the steps that unblock bookings */
            <View style={styles.section}>
              <SectionHeading title="Start taking bookings" />
              <View style={styles.panel}>
                {steps.map((s, i) => (
                  <Pressable
                    key={s.key}
                    style={[styles.row, i > 0 && styles.divider]}
                    onPress={s.onPress}
                    disabled={s.done}
                    accessibilityRole="button"
                    accessibilityState={{ checked: s.done }}
                  >
                    <View style={[styles.stepDisc, s.done && styles.stepDiscDone]}>
                      <Feather name={s.done ? 'check' : s.icon} size={17} color={s.done ? colors.white : colors.link} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowStrong, s.done && styles.doneText]}>{s.label}</Text>
                      <Text style={styles.metaText}>{s.hint}</Text>
                    </View>
                    {!s.done && <Feather name="chevron-right" size={16} color={colors.borderStrong} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Booking problems only, and only when there are some */}
          {alerts.length > 0 && (
            <View style={styles.section}>
              <SectionHeading title="Needs your attention" />
              <View style={styles.panel}>
                {alerts.map((item, i) => (
                  <View key={item.id} style={[styles.row, i > 0 && styles.divider]}>
                    <View style={styles.flag} />
                    <Text style={styles.rowText}>{BOOKING_ALERTS[item.id].text(item.data.count)}</Text>
                    <Pressable style={styles.darkBtn} onPress={() => openAlert(item)} accessibilityRole="button">
                      <Text style={styles.darkBtnText}>{BOOKING_ALERTS[item.id].action}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeading title="Up next" link="Calendar" onLink={() => navigation.navigate('Calendar')} />
            <View style={styles.panel}>
              {bookings.upcoming.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="calendar" size={18} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {ready ? 'New bookings show up here as soon as customers make them.' : 'Bookings show up here once customers can book you.'}
                  </Text>
                </View>
              ) : (
                bookings.upcoming.map((b, i) => (
                  <Pressable key={b.id} style={[styles.row, i > 0 && styles.divider]} onPress={() => navigation.navigate('Bookings')} accessibilityRole="button">
                    <View style={styles.person}>
                      <Text style={styles.personInitial}>{(b.customerName ?? 'C').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowStrong} numberOfLines={1}>{b.customerName ?? 'Customer'}</Text>
                      <Text style={styles.metaText}>
                        {formatDateTime(b.scheduledAt)}
                        {b.status === 'pending_payment' ? ' · awaiting payment' : ''}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.borderStrong} />
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* Everything else is one quiet line, not a section */}
          {otherUpdates > 0 && (
            <Pressable style={styles.more} onPress={() => navigation.navigate('More')} accessibilityRole="button">
              <Feather name="grid" size={15} color={colors.link} />
              <Text style={styles.sectionLink}>
                {otherUpdates} {otherUpdates === 1 ? 'update' : 'updates'} in More
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: GUTTER, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: '800', fontSize: 16, color: colors.link },
  bizName: { flex: 1, fontWeight: '700', fontSize: 15, color: colors.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: 12, color: colors.onAccent },
  greeting: { fontWeight: '700', fontSize: 26, lineHeight: 32, letterSpacing: -0.4, color: colors.text, marginTop: 28 },
  greetingSub: { fontWeight: '500', fontSize: 15, lineHeight: 21, color: colors.textSecondary, marginTop: 6 },

  // Body
  body: { gap: 32, paddingTop: spacing.sm },
  section: { paddingHorizontal: GUTTER, gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700', fontSize: 19, letterSpacing: -0.4, color: colors.text },
  sectionLink: { fontWeight: '600', fontSize: 13, color: colors.link },
  panel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { flex: 1, fontWeight: '500', fontSize: 14, lineHeight: 20, color: colors.text },
  rowStrong: { fontWeight: '600', fontSize: 14, color: colors.text },
  metaText: { fontWeight: '400', fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 2 },
  flag: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.warning },
  darkBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  darkBtnText: { fontWeight: '600', fontSize: 13, color: colors.onPrimary },
  person: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  personInitial: { fontWeight: '700', fontSize: 14, color: colors.link },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 18 },
  emptyText: { flex: 1, fontWeight: '500', fontSize: 13, lineHeight: 19, color: colors.textSecondary },

  // Booking link hero: Scalio navy in both themes
  hero: { backgroundColor: '#1e3a8a', borderRadius: 24, padding: 22 },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.onDarkFaint, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontWeight: '800', fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: colors.onDark, marginTop: 16 },
  heroBody: { fontWeight: '400', fontSize: 14, lineHeight: 20, color: colors.onDarkMuted, marginTop: 6 },
  linkPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 18,
    borderWidth: 1, borderColor: colors.onDarkLine, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 11,
  },
  linkText: { flex: 1, fontWeight: '500', fontSize: 13, color: colors.onDark },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: 12,
    backgroundColor: '#ffffff', borderRadius: radius.pill, paddingVertical: 14,
  },
  heroBtnText: { fontWeight: '700', fontSize: 15, color: '#1e3a8a' },

  // Set-up steps
  stepDisc: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  stepDiscDone: { backgroundColor: colors.success },
  doneText: { color: colors.textMuted, textDecorationLine: 'line-through' },

  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  errorBox: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.md },
  retry: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
}));
