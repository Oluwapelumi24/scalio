import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  BASKET_PRICE_KOBO,
  DROPOFF_SURCHARGE_KOBO,
  DUVET_PRICE_KOBO,
  formatNaira,
} from '../lib/laundry';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LaundryServiceType'>;

export function LaundryServiceTypeScreen({ route, navigation }: Props) {
  const { vendor } = route.params;

  function select(serviceType: 'self_service' | 'drop_off') {
    navigation.navigate('LaundryBooking', { vendor, serviceType });
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>How would you like to wash?</Text>
        <Text style={styles.subtitle}>{vendor.businessName}</Text>
      </SafeAreaView>

      <View style={styles.body}>
        {/* Self-service */}
        <Pressable style={styles.card} onPress={() => select('self_service')}>
          <View style={[styles.iconBadge, { backgroundColor: '#e0f2fe' }]}>
            <Feather name="rotate-cw" size={24} color="#0369a1" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Self-service</Text>
            <Text style={styles.cardDesc}>Use our machines at the laundromat. Pick your own time slot.</Text>
            <Text style={styles.cardPrice}>
              From {formatNaira(BASKET_PRICE_KOBO)} / basket
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Drop-off */}
        <Pressable style={styles.card} onPress={() => select('drop_off')}>
          <View style={[styles.iconBadge, { backgroundColor: '#f0fdf4' }]}>
            <Feather name="package" size={24} color="#16a34a" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Drop-off & collect</Text>
            <Text style={styles.cardDesc}>Leave it with us, we'll wash and have it ready for you.</Text>
            <Text style={styles.cardPrice}>
              From {formatNaira(BASKET_PRICE_KOBO + DROPOFF_SURCHARGE_KOBO)} / basket
              {'  ·  '}{formatNaira(DUVET_PRICE_KOBO + DROPOFF_SURCHARGE_KOBO)} / duvet
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  cardDesc: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    marginTop: 6,
  },
});
