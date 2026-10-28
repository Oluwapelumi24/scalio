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
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { Vendor } from '@scalio/shared-types';
import type { MainTabScreenProps } from '../navigation/types';
import { listVendors } from '../lib/api';
import { CATEGORY_META, getVendorImageSource } from '../lib/categories';
import { INTERESTS } from '../lib/interests';
import { getCurrentUser } from '../lib/session';
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  SearchField,
  SectionTitle,
  type FeatherName,
} from '../components/ui';
import { GUTTER, makeStyles, spacing, useTheme } from '../theme';

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

const CARD_WIDTH = 176;
const CARD_IMAGE_HEIGHT = 124;

function shortAddress(address: string): string {
  const parts = address.split(',').map((s) => s.trim());
  return parts.length >= 2 ? parts.slice(-2).join(', ') : address;
}

function Rating({ vendor }: { vendor: Vendor }) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (vendor.rating == null && vendor.reviewCount == null) return null;
  return (
    <View style={styles.ratingRow}>
      <Feather name="star" size={13} color={colors.warning} />
      {vendor.rating != null ? <Text style={styles.ratingValue}>{vendor.rating.toFixed(1)}</Text> : null}
      {vendor.reviewCount != null ? <Text style={styles.reviewCount}>({vendor.reviewCount})</Text> : null}
    </View>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={vendor.businessName}
    >
      <Image source={getVendorImageSource(vendor)} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{vendor.businessName}</Text>
        <Rating vendor={vendor} />
        {vendor.address ? (
          <Text style={styles.cardSub} numberOfLines={1}>{shortAddress(vendor.address)}</Text>
        ) : null}
        <Text style={styles.cardTag} numberOfLines={1}>{vendor.category}</Text>
      </View>
    </Pressable>
  );
}

function CategoryChips({ onSelect }: { onSelect: (category: string) => void }) {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.categoryScroll}>
      {INTERESTS.map((category) => {
        const meta = CATEGORY_META[category as keyof typeof CATEGORY_META];
        return (
          <Pressable
            key={category}
            style={styles.categoryChip}
            onPress={() => onSelect(category)}
            accessibilityRole="button"
            accessibilityLabel={category}
          >
            {/* Dark mode: soft grey circle with a black glyph. Light mode: pale navy circle with a navy glyph. */}
            <View style={[styles.categoryIcon, scheme === 'dark' && { backgroundColor: '#d1d5db' }]}>
              <Feather name={meta.icon} size={18} color={scheme === 'dark' ? '#0a0a0a' : colors.link} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1}>{category}</Text>
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
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionTitle title={title} />
      {loading ? (
        <ActivityIndicator color={colors.link} style={{ marginVertical: spacing.xl }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.cardScroll}>
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onPress={() => onPress(vendor)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Search result row (full width) ──────────────────────────────────────────
function SearchResultCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.result, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={vendor.businessName}
    >
      <Image source={getVendorImageSource(vendor)} style={styles.resultImage} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.cardName} numberOfLines={1}>{vendor.businessName}</Text>
        <Rating vendor={vendor} />
        <Text style={styles.cardSub} numberOfLines={1}>
          {vendor.category}{vendor.address ? ` · ${shortAddress(vendor.address)}` : ''}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.text} />
    </Pressable>
  );
}

// ─── Bottom sheets (same look as the vendor app's Create sheet) ──────────────
function Sheet({
  visible,
  onClose,
  title,
  children,
  maxHeight,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: number;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} accessibilityRole="header">{title}</Text>
            <IconButton icon="x" label="Close" onPress={onClose} />
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────────
interface Filters {
  minRating: number | null;
  areas: string[];
  categories: string[];
}

const NO_FILTERS: Filters = { minRating: null, areas: [], categories: [] };

const RATING_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

function countFilters(f: Filters): number {
  return (f.minRating ? 1 : 0) + f.areas.length + f.categories.length;
}

/** The neighbourhood part of an address: "Bariga, Shomolu, Lagos" → "Shomolu". */
function areaOf(vendor: Vendor): string | null {
  if (!vendor.address) return null;
  const parts = vendor.address.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? null;
}

function matchesFilters(vendor: Vendor, f: Filters): boolean {
  if (f.minRating && (vendor.rating ?? 0) < f.minRating) return false;
  if (f.areas.length > 0 && !f.areas.includes(areaOf(vendor) ?? '')) return false;
  if (f.categories.length > 0 && !f.categories.includes(vendor.category)) return false;
  return true;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Outlined pill that fills navy when chosen. */
function Chip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: FeatherName }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && { opacity: 0.8 }]}
    >
      {icon ? <Feather name={icon} size={15} color={selected ? colors.onPrimary : colors.warning} /> : null}
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chipWrap}>{children}</View>
    </View>
  );
}

function FilterModal({
  visible,
  draft,
  onChange,
  onClear,
  onApply,
  onClose,
  areas,
  resultCount,
}: {
  visible: boolean;
  draft: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
  areas: string[];
  resultCount: number;
}) {
  const styles = useStyles();
  return (
    <Sheet visible={visible} onClose={onClose} title="Filter" maxHeight={SCREEN_H * 0.88}>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <FilterSection title="Rating">
          {RATING_OPTIONS.map((o) => (
            <Chip
              key={o.label}
              label={o.label}
              icon={o.value ? 'star' : undefined}
              selected={draft.minRating === o.value}
              onPress={() => onChange({ ...draft, minRating: o.value })}
            />
          ))}
        </FilterSection>

        {areas.length > 0 ? (
          <FilterSection title="Location">
            {areas.map((a) => (
              <Chip key={a} label={a} selected={draft.areas.includes(a)} onPress={() => onChange({ ...draft, areas: toggle(draft.areas, a) })} />
            ))}
          </FilterSection>
        ) : null}

        <FilterSection title="Category">
          {INTERESTS.map((cat) => (
            <Chip key={cat} label={cat} selected={draft.categories.includes(cat)} onPress={() => onChange({ ...draft, categories: toggle(draft.categories, cat) })} />
          ))}
        </FilterSection>
      </ScrollView>
      <View style={styles.sheetActions}>
        <Button label="Clear all" variant="secondary" onPress={onClear} style={{ flex: 1 }} />
        <Button
          label={resultCount === 1 ? 'Show 1 result' : `Show ${resultCount} results`}
          onPress={onApply}
          disabled={resultCount === 0}
          style={{ flex: 1.4 }}
        />
      </View>
    </Sheet>
  );
}

function LocationRow({
  icon,
  label,
  query,
  onPress,
}: {
  icon: FeatherName;
  label: string;
  query?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  // Bold the matched part of the label
  const parts = query ? label.split(new RegExp(`(${query})`, 'gi')) : [label];

  return (
    <Pressable
      style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.background }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={20} color={colors.textSecondary} />
      <Text style={[styles.sheetRowLabel, { flex: 1 }]} numberOfLines={1}>
        {parts.map((part, i) =>
          part.toLowerCase() === (query ?? '').toLowerCase()
            ? <Text key={i} style={{ fontWeight: '700' }}>{part}</Text>
            : <Text key={i}>{part}</Text>,
        )}
      </Text>
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
  const { colors } = useTheme();
  const styles = useStyles();
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
    <Sheet visible={visible} onClose={onClose} title="Your location" maxHeight={SCREEN_H * 0.85}>
      <View style={styles.sheetSearch}>
        <Feather name="search" size={20} color={colors.text} />
        <TextInput
          ref={inputRef}
          style={styles.sheetSearchInput}
          placeholder="Neighbourhood, street or city"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="done"
          onSubmitEditing={() => { if (trimmed) void save(trimmed); }}
          autoCorrect={false}
          accessibilityLabel="Search for a location"
        />
        {trimmed.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable
          style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.background }]}
          onPress={handleGPS}
          disabled={detectingGPS}
          accessibilityRole="button"
        >
          <View style={styles.sheetIcon}>
            {detectingGPS ? <ActivityIndicator color={colors.link} /> : <Feather name="navigation" size={20} color={colors.link} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetRowLabel}>{detectingGPS ? 'Finding you…' : 'Use my current location'}</Text>
            {current && current !== 'Current Location' ? (
              <Text style={styles.sheetRowSub}>Now set to {current}</Text>
            ) : null}
          </View>
        </Pressable>

        {trimmed.length > 0 ? (
          suggestions.length > 0 ? (
            <>
              <Text style={styles.sheetLabel}>Suggestions</Text>
              {suggestions.map((area) => (
                <LocationRow key={area} icon="map-pin" label={area} query={trimmed} onPress={() => void save(area)} />
              ))}
            </>
          ) : (
            // No known match: let them use exactly what they typed
            <LocationRow icon="corner-down-right" label={`Use “${trimmed}”`} onPress={() => void save(trimmed)} />
          )
        ) : (
          <>
            {recents.length > 0 ? (
              <>
                <Text style={styles.sheetLabel}>Recent</Text>
                {recents.map((loc) => (
                  <LocationRow key={loc} icon="clock" label={loc} onPress={() => void save(loc)} />
                ))}
              </>
            ) : null}
            <Text style={styles.sheetLabel}>Popular in Lagos</Text>
            {POPULAR_AREAS.map((area) => (
              <LocationRow key={area} icon="map-pin" label={area} onPress={() => void save(area)} />
            ))}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('Yaba, Lagos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>(NO_FILTERS);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
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

  const filterCount = countFilters(filters);
  const isSearching = searchQuery.trim().length > 0 || filterCount > 0;

  const areas = useMemo(
    () => [...new Set((vendors ?? []).map(areaOf).filter((a): a is string => !!a))].sort(),
    [vendors],
  );

  const matchesQuery = useCallback((v: Vendor) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.businessName.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.address ?? '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const searchResults = useMemo(
    () => (vendors ?? []).filter((v) => matchesQuery(v) && matchesFilters(v, filters)),
    [vendors, matchesQuery, filters],
  );

  const draftCount = useMemo(
    () => (vendors ?? []).filter((v) => matchesQuery(v) && matchesFilters(v, draftFilters)).length,
    [vendors, matchesQuery, draftFilters],
  );

  function openVendor(vendor: Vendor) {
    navigation.navigate('VendorProfile', { vendor });
  }

  function openFilter() {
    setDraftFilters(filters);
    setFilterVisible(true);
  }

  function applyFilter() {
    setFilters(draftFilters);
    setFilterVisible(false);
  }

  const firstName = user?.name.split(' ')[0] ?? null;
  const filtersActive = filterCount > 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting, location and account */}
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.greeting} accessibilityRole="header">
              Hey{firstName ? `, ${firstName}` : ' there'}
            </Text>
            <Pressable
              style={styles.locationRow}
              onPress={() => setLocationModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Location: ${location}. Change`}
            >
              <Feather name="map-pin" size={16} color={colors.link} />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
              <Feather name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.headerRight}>
            <IconButton icon="bell" label="Notifications" onPress={() => {}} />
            {user ? (
              <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Profile">
                <Avatar name={user.name} size={44} />
              </Pressable>
            ) : (
              <Button label="Sign in" size="sm" onPress={() => navigation.navigate('SignIn')} />
            )}
          </View>
        </View>

        <View>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search businesses and services"
            onFilter={openFilter}
          />
          {filtersActive ? (
            <View style={styles.filterBadge} pointerEvents="none">
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          ) : null}
        </View>

        {error ? <EmptyState icon="wifi-off" title="Couldn’t load businesses" body={error} /> : null}

        {isSearching ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.resultsHead}>
              <SectionTitle
                title={
                  searchResults.length === 0
                    ? 'No results'
                    : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                }
              />
              {filtersActive ? (
                <Pressable onPress={() => setFilters(NO_FILTERS)} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
            {vendors === null && !error ? (
              <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.link} />
            ) : searchResults.length > 0 ? (
              <View style={styles.resultsCard}>
                {searchResults.map((v) => (
                  <SearchResultCard key={v.id} vendor={v} onPress={() => openVendor(v)} />
                ))}
              </View>
            ) : (
              <EmptyState icon="search" title="Nothing matches" body="Try a different word or clear the filters." />
            )}
          </View>
        ) : (
          <>
            <CategoryChips onSelect={(cat) => setFilters({ ...NO_FILTERS, categories: [cat] })} />

            <SectionRow
              title="Recommended"
              vendors={recommended}
              onPress={openVendor}
              loading={vendors === null && !error}
            />

            {vendors === null || rest.length > 0 ? (
              <SectionRow
                title="New to Scalio"
                vendors={rest}
                onPress={openVendor}
                loading={vendors === null && !error}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <FilterModal
        visible={filterVisible}
        draft={draftFilters}
        onChange={setDraftFilters}
        onClear={() => setDraftFilters(NO_FILTERS)}
        onApply={applyFilter}
        onClose={() => setFilterVisible(false)}
        areas={areas}
        resultCount={draftCount}
      />

      <LocationModal
        visible={locationModalVisible}
        current={location}
        onSelect={(loc) => setLocation(loc)}
        onClose={() => setLocationModalVisible(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: GUTTER, paddingBottom: 48, gap: 28 },
  bleed: { marginHorizontal: -GUTTER },
  link: { fontSize: 14, fontWeight: '600', color: colors.link },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 8 },
  greeting: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.6, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  locationText: { fontSize: 14, fontWeight: '500', color: colors.text, maxWidth: 200 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  filterBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
  },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: colors.onAccent },

  categoryScroll: { paddingHorizontal: GUTTER, gap: 4 },
  categoryChip: { width: 76, alignItems: 'center', gap: 6 },
  categoryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 12, fontWeight: '500', color: colors.text, textAlign: 'center' },

  cardScroll: { paddingHorizontal: GUTTER, gap: 14 },
  card: { width: CARD_WIDTH, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
  cardImage: { width: '100%', height: CARD_IMAGE_HEIGHT, backgroundColor: colors.surface },
  cardBody: { padding: 14, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary },
  cardTag: { fontSize: 13, fontWeight: '600', color: colors.link, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  reviewCount: { fontSize: 13, color: colors.textSecondary },

  resultsHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  resultsCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, backgroundColor: colors.card },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  resultImage: { width: 60, height: 60, borderRadius: 14, backgroundColor: colors.surface },

  overlay: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: GUTTER - 8, paddingTop: 10, gap: 2,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 6 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, marginBottom: 6 },
  sheetTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
  sheetLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, paddingHorizontal: 8, marginTop: 14, marginBottom: 4 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 16 },
  sheetRowLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  sheetRowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sheetIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  sheetActions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: 8, paddingTop: spacing.lg },
  sheetSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 18, marginHorizontal: 8, marginBottom: 8,
    borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.background,
  },
  sheetSearchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 },
  filterSection: { gap: 12, paddingHorizontal: 8, paddingTop: 14, paddingBottom: 6 },
  filterTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.background,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '500', color: colors.text },
  chipLabelOn: { color: colors.onPrimary, fontWeight: '600' },
}));
