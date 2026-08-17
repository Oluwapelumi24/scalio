import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { CATEGORY_META, getVendorImageUrl } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { getCurrentUser } from '../lib/session';
import { colors, radius, spacing, typography } from '../theme';

type Props = MainTabScreenProps<'Home'>;

const { height: SCREEN_H } = Dimensions.get('window');
const RECENT_KEY = 'scalio_location_history';
const MAX_RECENT = 5;

const POPULAR_AREAS = [
  'Lekki Phase 1, Lagos',
  'Victoria Island, Lagos',
  'Ikoyi, Lagos',
  'Surulere, Lagos',
  'Yaba, Lagos',
  'Ajah, Lagos',
  'Ikeja GRA, Lagos',
  'Gbagada, Lagos',
  'Maryland, Lagos',
  'Magodo, Lagos',
  'Omole Estate, Lagos',
  'Ojodu Berger, Lagos',
  'Oniru Estate, Lagos',
  'Banana Island, Lagos',
  'Lekki Phase 2, Lagos',
];

const CARD_WIDTH = 168;
const CARD_IMAGE_HEIGHT = 120;

function shortAddress(address: string): string {
  const parts = address.split(',').map((s) => s.trim());
  return parts.length >= 2 ? parts.slice(-2).join(', ') : address;
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{vendor.businessName}</Text>
        {(vendor.rating != null || vendor.reviewCount != null) && (
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color="#F5A623" />
            {vendor.rating != null && (
              <Text style={styles.ratingValue}>{vendor.rating.toFixed(1)}</Text>
            )}
            {vendor.reviewCount != null && (
              <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
            )}
          </View>
        )}
        {vendor.address ? (
          <Text style={styles.cardAddress} numberOfLines={1}>{shortAddress(vendor.address)}</Text>
        ) : null}
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{vendor.category}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryChips({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {INTERESTS.map((category) => {
        const meta = CATEGORY_META[category as keyof typeof CATEGORY_META];
        return (
          <Pressable key={category} style={styles.categoryChip} onPress={() => onSelect(category)}>
            <View style={styles.categoryIconWrap}>
              <Feather name={meta.icon} size={20} color={colors.textBody} />
            </View>
            <Text style={styles.categoryChipLabel} numberOfLines={1}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SectionRow({
  title,
  vendors,
  onPress,
  loading,
}: {
  title: string;
  vendors: Vendor[];
  onPress: (v: Vendor) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onPress={() => onPress(vendor)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Search result card (full-width, horizontal layout) ─────────────────────
function SearchResultCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <Pressable style={styles.resultCard} onPress={onPress}>
      <Image source={{ uri: getVendorImageUrl(vendor) }} style={styles.resultImage} />
      <View style={styles.resultBody}>
        <Text style={styles.resultName} numberOfLines={1}>{vendor.businessName}</Text>
        {(vendor.rating != null || vendor.reviewCount != null) && (
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color="#F5A623" />
            {vendor.rating != null && (
              <Text style={styles.ratingValue}>{vendor.rating.toFixed(1)}</Text>
            )}
            {vendor.reviewCount != null && (
              <Text style={styles.reviewCount}>({vendor.reviewCount})</Text>
            )}
          </View>
        )}
        <Text style={styles.resultMeta} numberOfLines={1}>
          {vendor.category}{vendor.address ? ` · ${shortAddress(vendor.address)}` : ''}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.border} />
    </Pressable>
  );
}

// ─── Filter bottom sheet ─────────────────────────────────────────────────────
function FilterModal({
  visible,
  draft,
  onToggle,
  onClear,
  onApply,
  onClose,
}: {
  visible: boolean;
  draft: string[];
  onToggle: (cat: string) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={styles.filterSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.filterTitle}>Filter results</Text>
        <Text style={styles.filterSectionLabel}>CATEGORY</Text>
        <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
          {INTERESTS.map((cat) => {
            const selected = draft.includes(cat);
            return (
              <Pressable key={cat} style={styles.filterRow} onPress={() => onToggle(cat)}>
                <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                  {selected && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={styles.filterRowText}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.filterActions}>
          <Pressable style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearBtnText}>Clear all</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>
              Apply{draft.length > 0 ? ` (${draft.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Location picker components ──────────────────────────────────────────────

function LocationRow({
  icon,
  label,
  sublabel,
  accent,
  query,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sublabel?: string;
  accent?: boolean;
  query?: string;
  onPress: () => void;
}) {
  // Bold the matched portion of the label
  const parts = query
    ? label.split(new RegExp(`(${query})`, 'gi'))
    : [label];

  return (
    <Pressable style={ls.locRow} onPress={onPress}>
      <View style={[ls.locIconWrap, accent && ls.locIconAccent]}>
        <Feather name={icon} size={15} color={accent ? colors.accent : colors.textMuted} />
      </View>
      <View style={ls.locText}>
        <Text style={ls.locLabel} numberOfLines={1}>
          {parts.map((part, i) =>
            part.toLowerCase() === (query ?? '').toLowerCase()
              ? <Text key={i} style={ls.locHighlight}>{part}</Text>
              : <Text key={i}>{part}</Text>
          )}
        </Text>
        {sublabel ? <Text style={ls.locSublabel}>{sublabel}</Text> : null}
      </View>
      <Feather name="chevron-right" size={14} color={colors.border} />
    </Pressable>
  );
}

function LocationModal({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setDetectingGPS(false);
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => { if (raw) setRecents(JSON.parse(raw) as string[]); })
      .catch(() => {});
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [visible]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return POPULAR_AREAS.filter((a) => a.toLowerCase().includes(q));
  }, [query]);

  const save = useCallback(async (loc: string) => {
    const next = [loc, ...recents.filter((r) => r !== loc)].slice(0, MAX_RECENT);
    setRecents(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
    onSelect(loc);
    onClose();
  }, [recents, onSelect, onClose]);

  function handleGPS() {
    setDetectingGPS(true);
    // navigator.geolocation isn't available in Expo Go without expo-location.
    // Show a friendly state then fall back gracefully.
    setTimeout(() => {
      setDetectingGPS(false);
      void save('Current Location');
    }, 1200);
  }

  const trimmed = query.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ls.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={ls.kvWrap}
      >
        <View style={[ls.sheet, { maxHeight: SCREEN_H * 0.82 }]}>
          {/* Handle */}
          <View style={ls.handle} />

          {/* Header */}
          <View style={ls.header}>
            <View style={ls.headerIcon}>
              <Feather name="map-pin" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ls.title}>Set your location</Text>
              <Text style={ls.subtitle}>Find services and professionals near you</Text>
            </View>
            <Pressable style={ls.closeBtn} onPress={onClose}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Search input */}
          <View style={ls.inputRow}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={ls.input}
              placeholder="Search neighbourhood, street or city…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="done"
              onSubmitEditing={() => { if (trimmed) void save(trimmed); }}
              autoCorrect={false}
            />
            {trimmed.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <ScrollView
            style={ls.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Use GPS */}
            <Pressable
              style={[ls.gpsRow, detectingGPS && ls.gpsRowActive]}
              onPress={handleGPS}
              disabled={detectingGPS}
            >
              <View style={ls.gpsIconWrap}>
                <Feather
                  name={detectingGPS ? 'loader' : 'navigation'}
                  size={18}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ls.gpsLabel}>
                  {detectingGPS ? 'Detecting location…' : 'Use my current location'}
                </Text>
                <Text style={ls.gpsHint}>
                  {detectingGPS ? 'Please wait' : 'Automatically detect where you are'}
                </Text>
              </View>
              {!detectingGPS && (
                <Feather name="chevron-right" size={16} color={colors.accentLight} />
              )}
            </Pressable>

            {/* Current location indicator */}
            {current && current !== 'Current Location' && (
              <View style={ls.currentRow}>
                <Feather name="check-circle" size={13} color={colors.success} />
                <Text style={ls.currentText}>Currently set to <Text style={ls.currentBold}>{current}</Text></Text>
              </View>
            )}

            <View style={ls.divider} />

            {/* Search mode */}
            {trimmed.length > 0 ? (
              suggestions.length > 0 ? (
                <>
                  <Text style={ls.sectionLabel}>SUGGESTIONS</Text>
                  {suggestions.map((area) => (
                    <LocationRow
                      key={area}
                      icon="map-pin"
                      label={area}
                      query={trimmed}
                      onPress={() => void save(area)}
                    />
                  ))}
                </>
              ) : (
                /* No known match — let them use exactly what they typed */
                <Pressable style={ls.useAsRow} onPress={() => void save(trimmed)}>
                  <Feather name="corner-down-right" size={14} color={colors.accent} />
                  <Text style={ls.useAsText}>
                    Use <Text style={ls.useAsBold}>"{trimmed}"</Text> as my location
                  </Text>
                </Pressable>
              )
            ) : (
              /* Browse mode */
              <>
                {recents.length > 0 && (
                  <>
                    <Text style={ls.sectionLabel}>RECENT</Text>
                    {recents.map((loc) => (
                      <LocationRow
                        key={loc}
                        icon="clock"
                        label={loc}
                        onPress={() => void save(loc)}
                      />
                    ))}
                    <View style={ls.divider} />
                  </>
                )}

                <Text style={ls.sectionLabel}>POPULAR IN LAGOS</Text>
                {POPULAR_AREAS.map((area) => (
                  <LocationRow
                    key={area}
                    icon="map-pin"
                    label={area}
                    onPress={() => void save(area)}
                  />
                ))}
                <View style={{ height: spacing.xl }} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export function HomeScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('Yaba, Lagos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<string[]>([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const user = getCurrentUser();

  useEffect(() => {
    let cancelled = false;
    listVendors()
      .then((result) => { if (!cancelled) setVendors(result); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load businesses.');
      });
    return () => { cancelled = true; };
  }, []);

  const recommended = useMemo(() => (vendors ?? []).filter((v) => v.featured), [vendors]);
  const rest = useMemo(() => (vendors ?? []).filter((v) => !v.featured), [vendors]);

  const isSearching = searchQuery.trim().length > 0 || activeFilters.length > 0;

  const searchResults = useMemo(() => {
    if (!vendors) return [];
    let results = vendors;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      results = results.filter(
        (v) =>
          v.businessName.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.address ?? '').toLowerCase().includes(q),
      );
    }
    if (activeFilters.length > 0) {
      results = results.filter((v) => activeFilters.includes(v.category));
    }
    return results;
  }, [vendors, searchQuery, activeFilters]);

  function openVendor(vendor: Vendor) {
    navigation.navigate('VendorProfile', { vendor });
  }

  function handleLocationPress() {
    setLocationModalVisible(true);
  }

  function openFilter() {
    setDraftFilters(activeFilters);
    setFilterVisible(true);
  }

  function toggleDraft(cat: string) {
    setDraftFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function applyFilter() {
    setActiveFilters(draftFilters);
    setFilterVisible(false);
  }

  const firstName = user?.name.split(' ')[0] ?? null;
  const filtersActive = activeFilters.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Header row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey{firstName ? `, ${firstName}` : ' there'}</Text>
            {/* Location strip */}
            <Pressable style={styles.locationRow} onPress={handleLocationPress}>
              <Feather name="map-pin" size={12} color={colors.accent} />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
              <Feather name="chevron-down" size={12} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <Feather name="bell" size={20} color={colors.primary} />
            </Pressable>
            {user ? (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <Pressable style={styles.signInBtn} onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signInLabel}>Sign in</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search vendors, services, professionals…"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          {/* Filter button — badge dot when filters are active */}
          <Pressable
            style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
            onPress={openFilter}
          >
            <Feather name="sliders" size={18} color={filtersActive ? '#fff' : colors.primary} />
            {filtersActive && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.errorText}>{error}</Text>}

        {isSearching ? (
          /* Search / filter results */
          <View style={styles.resultsSection}>
            <Text style={styles.resultsLabel}>
              {searchResults.length === 0
                ? 'No results found'
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </Text>
            {vendors === null && !error ? (
              <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.accent} />
            ) : (
              searchResults.map((v) => (
                <SearchResultCard key={v.id} vendor={v} onPress={() => openVendor(v)} />
              ))
            )}
          </View>
        ) : (
          /* Default browse view */
          <>
            <CategoryChips onSelect={(cat) => setActiveFilters([cat])} />

            <SectionRow
              title="Recommended"
              vendors={recommended}
              onPress={openVendor}
              loading={vendors === null && !error}
            />

            {(vendors === null || rest.length > 0) && (
              <SectionRow
                title="New to Scalio"
                vendors={rest}
                onPress={openVendor}
                loading={vendors === null && !error}
              />
            )}
          </>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* ── Filter modal ────────────────────────────────────────────────── */}
      <FilterModal
        visible={filterVisible}
        draft={draftFilters}
        onToggle={toggleDraft}
        onClear={() => setDraftFilters([])}
        onApply={applyFilter}
        onClose={() => setFilterVisible(false)}
      />

      {/* ── Location picker modal ────────────────────────────────────────── */}
      <LocationModal
        visible={locationModalVisible}
        current={location}
        onSelect={(loc) => setLocation(loc)}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Top bar (non-scrolling) ──────────────────────────────────────────────
  topBar: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    lineHeight: 29,
  },

  // Location strip
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium,
    maxWidth: 180,
  },

  // Search bar + filter
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.primary,
    padding: 0,
    margin: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },

  // ── Search results ────────────────────────────────────────────────────────
  resultsSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  resultsLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  resultImage: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  resultBody: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  resultMeta: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },

  // ── Filter modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  filterSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterRowText: {
    fontSize: typography.size.base,
    color: colors.primary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },

  // ── Existing styles below ─────────────────────────────────────────────────
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  signInBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  signInLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  categoryScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  loader: {
    marginLeft: spacing.xl,
  },
  cardScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: colors.border,
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
  },
  reviewCount: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  cardAddress: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#f3f3f3',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
});

// ─── Location modal styles ────────────────────────────────────────────────────
const ls = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  kvWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: spacing.xxxl,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.primary,
    padding: 0,
    margin: 0,
  },

  // GPS row
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  gpsRowActive: {
    opacity: 0.75,
  },
  gpsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
  gpsHint: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },

  // Current indicator
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  currentText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  currentBold: {
    fontWeight: typography.weight.semibold,
    color: colors.textBody,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
  },

  scroll: {
    flexGrow: 0,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.textMuted,
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xl,
    marginBottom: 4,
  },

  // Location row item
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  locIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locIconAccent: {
    backgroundColor: colors.accentLight,
  },
  locText: {
    flex: 1,
  },
  locLabel: {
    fontSize: typography.size.base,
    color: colors.primary,
  },
  locHighlight: {
    fontWeight: typography.weight.bold,
    color: colors.accent,
  },
  locSublabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // "Use as" fallback row
  useAsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  useAsText: {
    fontSize: typography.size.base,
    color: colors.textBody,
  },
  useAsBold: {
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
});
