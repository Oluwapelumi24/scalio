import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageSource } from '../lib/categories';
import { Button, Divider, EmptyState, ListGroup, SectionTitle, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VendorProfile'>;

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function VendorProfileScreen({ route, navigation }: Props) {
  const { vendor } = route.params;
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categoryMeta = getCategoryMeta(vendor.category);

  useEffect(() => {
    let cancelled = false;
    listServices(vendor.id)
      .then((result) => { if (!cancelled) setServices(result); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load services.');
      });
    return () => { cancelled = true; };
  }, [vendor.id]);

  const isLaundry = vendor.category === 'Laundromat';

  function handleBook() {
    if (isLaundry) {
      navigation.navigate('LaundryServiceType', { vendor });
    } else {
      navigation.navigate('ServiceSelection', { vendor });
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.hero}>
          <Image source={getVendorImageSource(vendor)} style={styles.heroImage} />
          <Pressable
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: getVendorAccentColor(vendor) }]}>
                <Feather name={categoryMeta.icon} size={13} color={colors.white} />
              </View>
              <Text style={styles.category}>{vendor.category}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">{vendor.businessName}</Text>
            {vendor.rating || vendor.address ? (
              <View style={{ gap: 6 }}>
                {vendor.rating ? (
                  <View style={styles.metaItem}>
                    <Feather name="star" size={16} color={colors.warning} />
                    <Text style={styles.metaText}>
                      {vendor.rating.toFixed(1)}
                      {vendor.reviewCount ? ` (${vendor.reviewCount} reviews)` : ''}
                    </Text>
                  </View>
                ) : null}
                {vendor.address ? (
                  <View style={styles.metaItem}>
                    <Feather name="map-pin" size={16} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{vendor.address}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionTitle title="Services" />
            {!services && !error ? <ActivityIndicator color={colors.link} style={{ marginTop: spacing.md }} /> : null}
            {error ? <EmptyState icon="wifi-off" title="Couldn’t load services" body={error} /> : null}
            {services && services.length === 0 ? <EmptyState icon="book-open" title="No services listed yet" /> : null}
            {services && services.length > 0 ? (
              <View style={styles.card}>
                {services.map((service, i) => (
                  <View key={service.id}>
                    {i > 0 ? <Divider inset={20} /> : null}
                    <View style={styles.serviceRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceSub}>{service.durationMinutes} min</Text>
                      </View>
                      <Text style={styles.servicePrice}>{formatNaira(service.priceKobo)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <ListGroup title="Cancellation policy">
            <Text style={styles.policy}>
              Please cancel at least 24 hours in advance to avoid a cancellation fee. Late cancellations and no-shows
              may be charged.
            </Text>
          </ListGroup>
        </View>
      </ScrollView>

      <StickyFooter>
        <Button label={isLaundry ? 'Place laundry order' : 'Book appointment'} onPress={handleBook} style={{ flex: 1 }} />
      </StickyFooter>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 260 },
  heroImage: { width: '100%', height: '100%', backgroundColor: colors.surface },
  backBtn: {
    position: 'absolute', left: GUTTER - 6, width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: GUTTER, paddingTop: 24, gap: 28 },
  titleBlock: { gap: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  category: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.6, color: colors.text },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, backgroundColor: colors.card },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 15 },
  serviceName: { fontSize: 15, fontWeight: '500', color: colors.text },
  serviceSub: { fontSize: 13, color: colors.textSecondary },
  servicePrice: { fontSize: 14, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  policy: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, paddingHorizontal: 20, paddingVertical: 14 },
}));
