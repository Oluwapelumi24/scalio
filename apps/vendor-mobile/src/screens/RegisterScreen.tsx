import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sendVendorSignupCode, vendorRegister, verifyVendorSignupCode } from '../lib/api';
import { BUSINESS_CATEGORIES } from '../lib/categories';
import { NIGERIA_STATES, serviceArea } from '../lib/nigeria';
import { saveSession } from '../lib/session';
import { routeAfterSignIn } from '../lib/postAuth';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type PickerKind = 'category' | 'state' | 'lga' | null;

export function RegisterScreen({ navigation }: Props) {
  const s = useSStyles();
  const { colors } = useTheme();
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [category, setCategory] = useState('');
  const [stateName, setStateName] = useState('');
  const [lga, setLga] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [proof, setProof] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'business'>('email');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<PickerKind>(null);
  const [pickerQuery, setPickerQuery] = useState('');

  const lgas = useMemo(
    () => NIGERIA_STATES.find((item) => item.state === stateName)?.lgas ?? [],
    [stateName],
  );

  const pickerOptions = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const all =
      picker === 'category' ? [...BUSINESS_CATEGORIES]
        : picker === 'state' ? NIGERIA_STATES.map((item) => item.state)
          : picker === 'lga' ? [...lgas]
            : [];
    if (!q) return all;
    return all.filter((item) => item.toLowerCase().includes(q));
  }, [picker, pickerQuery, lgas]);

  async function handleSendCode() {
    setError('');
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendVendorSignupCode(email.trim().toLowerCase());
      setCode('');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyVendorSignupCode(email.trim().toLowerCase(), code.trim());
      setProof(result.proof);
      setStep('business');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is wrong or has expired.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError('');
    if (!ownerName.trim() || !businessName.trim() || !proof || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!category) {
      setError('Choose what you offer.');
      return;
    }
    if (!stateName || !lga) {
      setError('Choose your state and local government.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await vendorRegister(
        ownerName.trim(),
        businessName.trim(),
        email.trim().toLowerCase(),
        password,
        proof,
        {
          registrationNumber: registrationNumber.trim() || undefined,
          category,
          address: serviceArea(lga, stateName),
        },
      );
      await saveSession({
        staffId: res.staff.id,
        vendorId: res.staff.vendorId,
        name: res.staff.name,
        email: res.staff.email,
        role: res.staff.role,
        token: res.accessToken,
      });
      navigation.replace(await routeAfterSignIn(res.staff.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.fill}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back */}
            <Pressable style={s.back} onPress={() => navigation.goBack()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>

            {/* Header */}
            <Text style={s.title}>{step === 'business' ? 'Register your business' : 'Start with your email'}</Text>
            <Text style={s.subtitle}>
              {step === 'email'
                ? 'We’ll send a 6-digit code. After you confirm it, you’ll create the business and go straight into the dashboard.'
                : step === 'code'
                  ? `Enter the code sent to ${email.trim().toLowerCase()}.`
                  : 'Create your Veno vendor account. Your listing will be reviewed before going live.'}
            </Text>

            {/* Fields */}
            <View style={s.form}>
              {step === 'email' ? (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Email address</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@business.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              ) : null}

              {step === 'code' ? (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>6-digit code</Text>
                  <TextInput
                    style={s.input}
                    value={code}
                    onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                  />
                </View>
              ) : null}

              {step === 'business' ? (
              <>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Your name</Text>
                <TextInput
                  style={s.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="e.g. Amaka Okafor"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Business name</Text>
                <TextInput
                  style={s.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Glam Nails Studio"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>What do you offer?</Text>
                <Pressable
                  style={s.picker}
                  onPress={() => { setPickerQuery(''); setPicker('category'); }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose category"
                >
                  <Text style={[s.pickerText, !category && { color: colors.textMuted }]}>
                    {category || 'Choose a category'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>State</Text>
                <Pressable
                  style={s.picker}
                  onPress={() => { setPickerQuery(''); setPicker('state'); }}
                  accessibilityRole="button"
                >
                  <Text style={[s.pickerText, !stateName && { color: colors.textMuted }]}>
                    {stateName === 'FCT' ? 'FCT (Abuja)' : stateName || 'Choose a state'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Local government</Text>
                <Pressable
                  style={[s.picker, !stateName && { opacity: 0.5 }]}
                  onPress={() => {
                    if (!stateName) return;
                    setPickerQuery('');
                    setPicker('lga');
                  }}
                  disabled={!stateName}
                  accessibilityRole="button"
                >
                  <Text style={[s.pickerText, !lga && { color: colors.textMuted }]}>
                    {lga || (stateName ? 'Choose an LGA' : 'Choose a state first')}
                  </Text>
                  <Feather name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Business registration number <Text style={s.optional}>(optional)</Text></Text>
                <TextInput
                  style={s.input}
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="e.g. RC1234567"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Password</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>
              </>
              ) : null}

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[s.btn, loading && s.btnDisabled]}
                onPress={() => void (step === 'email' ? handleSendCode() : step === 'code' ? handleVerify() : handleRegister())}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.btnLabel}>{step === 'email' ? 'Send code' : step === 'code' ? 'Continue' : 'Create account'}</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </Pressable>

              <View style={s.loginRow}>
                <Text style={s.loginPrompt}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                  <Text style={s.loginLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal visible={picker != null} animationType="slide" onRequestClose={() => setPicker(null)}>
        <SafeAreaView style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>
              {picker === 'category' ? 'Choose a category' : picker === 'state' ? 'Choose a state' : 'Choose an LGA'}
            </Text>
            <Pressable onPress={() => setPicker(null)} hitSlop={10} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={s.searchWrap}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              value={pickerQuery}
              onChangeText={setPickerQuery}
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
            ListEmptyComponent={<Text style={s.emptySearch}>No matches.</Text>}
            renderItem={({ item }) => {
              const selected =
                (picker === 'category' && category === item)
                || (picker === 'state' && stateName === item)
                || (picker === 'lga' && lga === item);
              return (
                <Pressable
                  style={s.option}
                  onPress={() => {
                    if (picker === 'category') setCategory(item);
                    if (picker === 'state') {
                      setStateName(item);
                      setLga('');
                    }
                    if (picker === 'lga') setLga(item);
                    setPicker(null);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={s.optionText}>{item === 'FCT' ? 'FCT (Abuja)' : item}</Text>
                  {selected ? <Feather name="check" size={16} color={colors.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const useSStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  back: {
    paddingVertical: spacing.lg,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.xxl,
  },
  form: { gap: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  optional: {
    fontWeight: typography.weight.regular,
    color: colors.textMuted,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.size.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    fontWeight: typography.weight.medium,
  },
  btn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  loginLink: {
    fontSize: typography.size.sm,
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },
  picker: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pickerText: {
    fontSize: typography.size.md,
    color: colors.text,
  },
  sheet: { flex: 1, backgroundColor: colors.background },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: typography.size.md, color: colors.text, padding: 0 },
  emptySearch: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: typography.size.md, color: colors.text },
}));
