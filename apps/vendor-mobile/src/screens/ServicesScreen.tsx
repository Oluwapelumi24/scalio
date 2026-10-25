import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { deleteService, formatNaira, listServices, type VendorService } from '../lib/api';
import { AddButton, EmptyState, IconButton, Page, PageHeader, SearchField } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Services'>;

const MODE_LABEL: Record<string, string> = {
  pay_on_arrival: 'Pay at the appointment',
  deposit: 'Deposit to book',
  full_prepayment: 'Pay in full to book',
};

function duration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(', ');
}

/** The service menu: what clients can book, with how long it takes and the price. */
export function ServicesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [services, setServices] = useState<VendorService[] | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setServices(await listServices());
    } catch {
      setServices([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Back from the form: show the change.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function options(service: VendorService) {
    Alert.alert(service.name, undefined, [
      { text: 'Edit', onPress: () => navigation.navigate('ServiceForm', { service }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete this service?', `Remove "${service.name}"? Existing bookings are not affected.`, [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteService(service.id);
                  setServices((prev) => (prev ?? []).filter((s) => s.id !== service.id));
                } catch (err) {
                  Alert.alert('Could not delete the service', err instanceof Error ? err.message : 'Please try again.');
                }
              },
            },
          ]),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }

  const q = query.trim().toLowerCase();
  const shown = (services ?? []).filter((s) => !q || s.name.toLowerCase().includes(q));

  return (
    <Page refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.link} />}>
      <PageHeader
        onBack={() => navigation.goBack()}
        actions={<AddButton onPress={() => navigation.navigate('ServiceForm', {})} />}
        title="Service menu"
        count={services?.length}
        description="What clients can book, how long it takes and what it costs."
      />
      {services && services.length > 0 ? <SearchField value={query} onChangeText={setQuery} placeholder="Search services" /> : null}

      {services == null ? (
        <ActivityIndicator color={colors.link} />
      ) : services.length === 0 ? (
        <EmptyState
          icon="scissors"
          title="No services yet"
          body="Add your first service so clients have something to book."
          action="Add a service"
          onAction={() => navigation.navigate('ServiceForm', {})}
        />
      ) : (
        <View>
          {shown.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => navigation.navigate('ServiceForm', { service: s })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, ${duration(s.durationMinutes)}, ${formatNaira(s.priceKobo)}`}
            >
              <View style={styles.bar} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.sub}>{duration(s.durationMinutes)} · {MODE_LABEL[s.paymentMode] ?? s.paymentMode}</Text>
                <Text style={styles.price}>{formatNaira(s.priceKobo)}</Text>
              </View>
              <IconButton icon="more-vertical" label={`Options for ${s.name}`} onPress={() => options(s)} />
            </Pressable>
          ))}
          {shown.length === 0 ? <Text style={styles.sub}>No services match “{query}”.</Text> : null}
        </View>
      )}
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 14 },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.accent },
  name: { fontSize: 19, fontWeight: '600', color: colors.text },
  sub: { fontSize: 15, color: colors.textSecondary },
  price: { fontSize: 17, color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] },
}));
