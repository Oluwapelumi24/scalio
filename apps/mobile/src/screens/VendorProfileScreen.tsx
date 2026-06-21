import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Service } from '@scalio/shared-types';
import type { RootStackParamList } from '../navigation/types';
import { listServices } from '../lib/api';
import { getCategoryMeta, getVendorAccentColor, getVendorImageUrl } from '../lib/categories';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VendorProfile'>;

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function VendorProfileScreen({ route, navigation }: Props) {
  const { vendor } = route.params;
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accentColor = getVendorAccentColor(vendor);
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

  function handleBook() {
    if (vendor.category === 'Laundromat') {
      navigation.navigate('LaundryServiceType', { vendor });
    } else {
      navigation.navigate('ServiceSelection', { vendor });
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {/* Business info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: accentColor }]}>
              <Feather name={categoryMeta.icon} size={18} color="#ffffff" />
            </View>
            <View style={styles.infoMeta}>
              <Text style={styles.businessName}>{vendor.businessName}</Text>
              <Text style={styles.categoryLabel}>{vendor.category}</Text>
            </View>
          </View>

          {(vendor.rating || vendor.address) && (
            <View style={styles.metaRow}>
              {vendor.rating ? (
                <View style={styles.metaItem}>
                  <Feather name="star" size={14} color="#F5A623" />
                  <Text style={styles.metaText}>
                    {vendor.rating.toFixed(1)}
                    {vendor.reviewCount ? ` (${vendor.reviewCount} reviews)` : ''}
                  </Text>
                </View>
              ) : null}
              {vendor.address ? (
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>{vendor.address}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {!services && !error && <ActivityIndicator style={{ marginTop: spacing.md }} />}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {services && services.length === 0 && (
            <Text style={styles.emptyText}>No services listed yet.</Text>
          )}
          {(services ?? []).map((service) => (
            <View key={service.id} style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.durationMinutes} min</Text>
              </View>
              <Text style={styles.servicePrice}>{formatNaira(service.priceKobo)}</Text>
            </View>
          ))}
        </View>

        {/* About / Policies placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation policy</Text>
          <Text style={styles.policyText}>
            Please cancel at least 24 hours in advance to avoid a cancellation fee. Late cancellations
            and no-shows may incur a charge.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky book CTA */}
      <View style={styles.ctaBar}>
        <Pressable
          style={[styles.bookBtn, { backgroundColor: accentColor }]}
          onPress={handleBook}
        >
          <Text style={styles.bookBtnLabel}>
            {vendor.category === 'Laundromat' ? 'Place laundry order' : 'Book appointment'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 260,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginHorizontal: spacing.xl,
    marginTop: -20,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  categoryBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoMeta: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  categoryLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  serviceDuration: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  policyText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.base,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.size.base,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: 36,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookBtn: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookBtnLabel: {
    color: '#ffffff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
});
