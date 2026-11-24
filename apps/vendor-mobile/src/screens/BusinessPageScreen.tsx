import { listingIsPublic } from '@veno/shared-types';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getVendorProfile, updateVendorProfile, uploadMedia, type VendorProfile } from '../lib/api';
import { BUSINESS_CATEGORIES } from '../lib/categories';
import { NIGERIA_STATES, parseServiceArea, serviceArea } from '../lib/nigeria';
import { Button, Field, Page, PageHeader, StickyFooter } from '../components/ui';
import { GUTTER, makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessPage'>;
type PickerKind = 'category' | 'state' | 'lga' | null;

const MAX_PHOTO_BASE64 = 4_700_000;

/** Category, area, photo and description — what customers see when they search and book. */
export function BusinessPageScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [category, setCategory] = useState('');
  const [stateName, setStateName] = useState('');
  const [lga, setLga] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoMediaId, setLogoMediaId] = useState<string | undefined>();
  const [clearLogo, setClearLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const lgas = useMemo(
    () => NIGERIA_STATES.find((item) => item.state === stateName)?.lgas ?? [],
    [stateName],
  );

  const pickerOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all =
      picker === 'category' ? [...BUSINESS_CATEGORIES]
        : picker === 'state' ? NIGERIA_STATES.map((s) => s.state)
          : picker === 'lga' ? [...lgas]
            : [];
    if (!q) return all;
    return all.filter((item) => item.toLowerCase().includes(q));
  }, [picker, query, lgas]);

  const load = useCallback(async () => {
    try {
      const p = await getVendorProfile();
      setProfile(p);
      setCategory(BUSINESS_CATEGORIES.includes(p.category as (typeof BUSINESS_CATEGORIES)[number]) ? p.category : '');
      const area = parseServiceArea(p.address);
      setStateName(area?.state ?? '');
      setLga(area?.lga ?? '');
      setDescription(p.description ?? '');
      setLogoUrl(p.logoUrl);
      setLogoMediaId(undefined);
      setClearLogo(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your business page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function pickPhoto(source: 'camera' | 'library') {
    setError('');
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Allow camera access for Veno in Settings to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError('That photo could not be read. Try another one.');
      return;
    }
    if (asset.base64.length > MAX_PHOTO_BASE64) {
      setError('That photo is too large. Choose one under 3.5 MB.');
      return;
    }
    setUploading(true);
    try {
      const media = await uploadMedia('image/jpeg', asset.base64);
      setLogoMediaId(media.id);
      setClearLogo(false);
      setLogoUrl(asset.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that photo.');
    } finally {
      setUploading(false);
    }
  }

  function choosePhoto() {
    Alert.alert(logoUrl && !clearLogo ? 'Change photo' : 'Add a photo', undefined, [
      { text: 'Take photo', onPress: () => void pickPhoto('camera') },
      { text: 'Choose from library', onPress: () => void pickPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    setError('');
    if (!category) {
      setError('Choose what you offer.');
      return;
    }
    if (!stateName || !lga) {
      setError('Choose your state and local government.');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateVendorProfile({
        category,
        address: serviceArea(lga, stateName),
        description: description.trim(),
        ...(logoMediaId ? { logoMediaId } : {}),
        ...(clearLogo ? { clearLogo: true } : {}),
      });
      setProfile(saved);
      setLogoUrl(saved.logoUrl);
      const approved = listingIsPublic(saved.approvalStatus);
      Alert.alert(
        'Saved',
        approved
          ? 'Customers will see these details on your booking page.'
          : 'Saved. Customers will see this once your business page is approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function selectOption(item: string) {
    if (picker === 'category') setCategory(item);
    if (picker === 'state') {
      setStateName(item);
      setLga('');
    }
    if (picker === 'lga') setLga(item);
    setPicker(null);
    setQuery('');
  }

  return (
    <Page
      footer={
        <StickyFooter>
          <Button
            label={saving ? 'Saving…' : 'Save business page'}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={loading || saving || uploading}
            style={{ flex: 1 }}
          />
        </StickyFooter>
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        title="Business page"
        description="This is what customers see when they search. Add a photo, category and the area you work in."
      />

      {loading ? (
        <ActivityIndicator color={colors.link} />
      ) : (
        <View style={styles.form}>
          {profile?.approvalStatus === 'rejected' && profile.reviewNote ? (
            <View style={styles.note}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.noteText}>{profile.reviewNote}</Text>
            </View>
          ) : profile?.approvalStatus === 'pending_review' ? (
            <View style={[styles.note, styles.notePending]}>
              <Feather name="clock" size={16} color={colors.warning} />
              <Text style={[styles.noteText, styles.notePendingText]}>
                We’re reviewing {profile.businessName}. Keep this page accurate while you wait.
              </Text>
            </View>
          ) : null}

          <View style={styles.photoRow}>
            <View style={styles.photo}>
              {logoUrl && !clearLogo ? (
                <Image source={{ uri: logoUrl }} style={styles.photoImg} />
              ) : (
                <Feather name="camera" size={22} color={colors.textMuted} />
              )}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable style={styles.photoBtn} onPress={choosePhoto} disabled={uploading}>
                <Text style={styles.photoBtnText}>{uploading ? 'Uploading…' : logoUrl && !clearLogo ? 'Change photo' : 'Add photo'}</Text>
              </Pressable>
              {logoUrl && !clearLogo ? (
                <Pressable
                  onPress={() => {
                    setClearLogo(true);
                    setLogoMediaId(undefined);
                    setLogoUrl(null);
                  }}
                >
                  <Text style={styles.removePhoto}>Remove photo</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>What do you offer?</Text>
            <Pressable
              style={styles.picker}
              onPress={() => { setQuery(''); setPicker('category'); }}
              accessibilityRole="button"
            >
              <Text style={[styles.pickerText, !category && { color: colors.textMuted }]}>
                {category || 'Choose a category'}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>State</Text>
            <Pressable
              style={styles.picker}
              onPress={() => { setQuery(''); setPicker('state'); }}
              accessibilityRole="button"
            >
              <Text style={[styles.pickerText, !stateName && { color: colors.textMuted }]}>
                {stateName === 'FCT' ? 'FCT (Abuja)' : stateName || 'Choose a state'}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Local government</Text>
            <Pressable
              style={[styles.picker, !stateName && { opacity: 0.5 }]}
              onPress={() => {
                if (!stateName) return;
                setQuery('');
                setPicker('lga');
              }}
              disabled={!stateName}
              accessibilityRole="button"
            >
              <Text style={[styles.pickerText, !lga && { color: colors.textMuted }]}>
                {lga || (stateName ? 'Choose an LGA' : 'Choose a state first')}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <Field
            label="A short description"
            optional
            value={description}
            onChangeText={setDescription}
            placeholder="What should a customer know before they book?"
            multiline
            counter={600}
            style={{ minHeight: 110, textAlignVertical: 'top' }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}

      <Modal visible={picker != null} animationType="slide" onRequestClose={() => setPicker(null)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>
              {picker === 'category' ? 'Choose a category' : picker === 'state' ? 'Choose a state' : 'Choose an LGA'}
            </Text>
            <Pressable onPress={() => setPicker(null)} hitSlop={10} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
          <FlatList
            data={pickerOptions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={<Text style={styles.emptySearch}>No matches.</Text>}
            renderItem={({ item }) => {
              const selected =
                (picker === 'category' && category === item)
                || (picker === 'state' && stateName === item)
                || (picker === 'lga' && lga === item);
              return (
                <Pressable style={styles.option} onPress={() => selectOption(item)} accessibilityRole="button">
                  <Text style={styles.optionText}>{item === 'FCT' ? 'FCT (Abuja)' : item}</Text>
                  {selected ? <Feather name="check" size={16} color={colors.link} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  form: { gap: 18, paddingHorizontal: GUTTER },
  fieldBlock: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  pickerText: { fontSize: 15, color: colors.text },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photo: {
    height: 80,
    width: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { height: '100%', width: '100%' },
  photoBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: colors.link },
  removePhoto: { fontSize: 12, color: colors.textMuted },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.errorLight,
  },
  notePending: { backgroundColor: colors.warningLight },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.error },
  notePendingText: { color: colors.warning },
  error: { fontSize: 13, color: colors.error },
  sheet: { flex: 1, backgroundColor: colors.background },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: GUTTER,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
  emptySearch: { paddingHorizontal: GUTTER, paddingVertical: 24, fontSize: 14, color: colors.textMuted },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 15, color: colors.text },
}));
