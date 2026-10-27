import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  DROPOFF_PRICE_KOBO,
  DUVET_PRICE_KOBO,
  SELF_SERVICE_PRICE_KOBO,
  formatNaira,
} from '../lib/laundry';
import { AppTile, Page, PageHeader, type FeatherName } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LaundryServiceType'>;

export function LaundryServiceTypeScreen({ route, navigation }: Props) {
  const { vendor } = route.params;
  const { colors } = useTheme();
  const styles = useStyles();

  function select(serviceType: 'self_service' | 'drop_off') {
    navigation.navigate('LaundryBooking', { vendor, serviceType });
  }

  const options: { key: 'self_service' | 'drop_off'; icon: FeatherName; tone: string; title: string; body: string; price: number }[] = [
    {
      key: 'self_service',
      icon: 'rotate-cw',
      tone: colors.accent,
      title: 'Self-service',
      body: 'Use our machines at the laundromat. Pick your own time.',
      price: SELF_SERVICE_PRICE_KOBO,
    },
    {
      key: 'drop_off',
      icon: 'package',
      tone: colors.success,
      title: 'Drop-off and collect',
      body: 'Leave it with us. We’ll wash it and have it ready for you.',
      price: DROPOFF_PRICE_KOBO,
    },
  ];

  return (
    <Page>
      <PageHeader onBack={() => navigation.goBack()} title="How would you like to wash?" description={vendor.businessName} />
      <View style={{ gap: 14 }}>
        {options.map((o) => (
          <Pressable
            key={o.key}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surface }]}
            onPress={() => select(o.key)}
            accessibilityRole="button"
            accessibilityLabel={`${o.title}. ${o.body}`}
          >
            <AppTile icon={o.icon} size={52} tone={o.tone} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.title}>{o.title}</Text>
              <Text style={styles.body}>{o.body}</Text>
              <Text style={styles.price}>
                {formatNaira(o.price)} wash · {formatNaira(DUVET_PRICE_KOBO)} per duvet
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.text} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  price: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] },
}));
