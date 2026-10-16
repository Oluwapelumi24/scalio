import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { disconnectMeta, getSocialConnections, metaConnectUrl, type SocialConnections } from '../lib/api';
import { getSession } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SocialAccounts'>;

const ROWS = [
  { platform: 'facebook' as const, name: 'Facebook Page', icon: 'facebook' as const },
  { platform: 'instagram' as const, name: 'Instagram', icon: 'instagram' as const },
];

export function SocialAccountsScreen({ navigation }: Props) {
  const [data, setData] = useState<SocialConnections | null>(null);
  const [busy, setBusy] = useState(false);
  const canManage = ['owner', 'manager'].includes(getSession()?.role ?? '');

  // Refreshes when the person comes back from the Facebook login in their browser.
  const load = useCallback(async () => {
    try { setData(await getSocialConnections()); } catch (err) {
      Alert.alert('Could not load your accounts', err instanceof Error ? err.message : 'Please try again.');
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function connect() {
    setBusy(true);
    try {
      const { url } = await metaConnectUrl();
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Could not start connecting', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  function disconnect() {
    Alert.alert('Disconnect Facebook and Instagram?', 'Scheduled posts to them won’t go out. Posts already published stay up.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: async () => { await disconnectMeta(); await load(); } },
    ]);
  }

  const connected = data?.connections ?? [];
  const needsReconnect = connected.some((c) => c.status === 'needs_reconnect');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Social accounts</Text>
        <Text style={styles.subtitle}>Connect your business accounts to publish and schedule posts straight from Scalio.</Text>
      </SafeAreaView>

      {!data ? <ActivityIndicator style={{ flex: 1 }} color={colors.accent} /> : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            {ROWS.map((r, i) => {
              const c = connected.find((x) => x.platform === r.platform);
              return (
                <View key={r.platform} style={[styles.row, i > 0 && styles.divider]}>
                  <Feather name={r.icon} size={20} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{r.name}</Text>
                    <Text style={[styles.meta, c?.status === 'needs_reconnect' && { color: colors.error }]}>
                      {c ? (c.status === 'active' ? `Connected: ${c.displayName}` : `Needs reconnecting: ${c.displayName}`) : 'Not connected'}
                    </Text>
                  </View>
                  {c?.status === 'active' && <Feather name="check-circle" size={18} color={colors.success} />}
                </View>
              );
            })}
          </View>

          {!data.available ? (
            <Text style={styles.meta}>{data.unavailableReason} Until then, copy captions from the content studio and post from each app.</Text>
          ) : !canManage ? (
            <Text style={styles.meta}>Ask an owner or manager to connect or change accounts.</Text>
          ) : (
            <>
              <Pressable style={[styles.primary, busy && styles.disabled]} onPress={connect} disabled={busy} accessibilityRole="button">
                <Text style={styles.primaryText}>{connected.length === 0 ? 'Connect Facebook & Instagram' : needsReconnect ? 'Reconnect' : 'Change Page'}</Text>
              </Pressable>
              <Text style={styles.meta}>
                You’ll log in with Facebook in your browser and choose your business Page. Instagram connects too if it’s a business or creator account linked to that Page. Scalio never sees your password. Come back to the app when you’re done.
              </Text>
              {connected.length > 0 && (
                <Pressable onPress={disconnect} style={{ alignSelf: 'flex-start' }}><Text style={styles.danger}>Disconnect</Text></Pressable>
              )}
            </>
          )}

          <View style={styles.note}>
            <Text style={styles.noteTitle}>TikTok and WhatsApp</Text>
            <Text style={styles.meta}>TikTok is waiting on TikTok’s approval. WhatsApp doesn’t let apps post to Status. For both, copy the caption from the content studio.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 36, height: 36, justifyContent: 'center', marginTop: spacing.md },
  title: { fontSize: typography.size.title, fontWeight: typography.weight.bold, color: colors.text },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  meta: { fontSize: typography.size.sm, color: colors.textMuted, lineHeight: 19 },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  disabled: { opacity: 0.5 },
  danger: { color: colors.error, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  note: { backgroundColor: colors.mist, borderRadius: radius.md, padding: spacing.md, gap: 4, marginTop: spacing.md },
  noteTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.text },
});
