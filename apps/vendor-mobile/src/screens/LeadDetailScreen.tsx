import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, convertLead, createLead, deleteLead, getLead, listStaff, updateLead,
  type Lead, type LeadSource, type StaffMember,
} from '../lib/api';
import { getSession } from '../lib/session';
import { radius, spacing, typography, useTheme, makeStyles } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LeadDetail'>;

const SOURCES = Object.keys(LEAD_SOURCE_LABELS) as LeadSource[];

/** Follow-up shortcuts, at 10am on the chosen day. */
const FOLLOW_UPS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];
const at10 = (days: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 10).toISOString();
};

/** wa.me wants the number in international form without '+' — assume Nigeria for local 0-numbers. */
const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
};

export function LeadDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const leadId = route.params.leadId;
  const session = getSession();
  const canAssign = session?.role !== 'practitioner';
  const canDelete = session?.role === 'owner' || session?.role === 'manager';

  const [lead, setLead] = useState<Lead | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(!!leadId);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('instagram');
  const [note, setNote] = useState('');
  const [assigned, setAssigned] = useState<string | null>(null);

  const fill = (l: Lead) => {
    setLead(l); setName(l.name); setPhone(l.phone ?? ''); setEmail(l.email ?? '');
    setSource(l.source); setNote(l.note ?? ''); setAssigned(l.assignedStaff?.id ?? null);
  };

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        leadId ? getLead(leadId) : Promise.resolve(null),
        canAssign ? listStaff().catch(() => []) : Promise.resolve([]),
      ]);
      if (l) fill(l);
      setStaff(s);
    } catch (err) {
      Alert.alert('Could not open the lead', err instanceof Error ? err.message : 'Please try again.');
      navigation.goBack();
    } finally { setLoading(false); }
  }, [leadId, canAssign, navigation]);
  useEffect(() => { void load(); }, [load]);

  async function run(title: string, fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } catch (err) {
      Alert.alert(title, err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  const save = () => run('Could not save', async () => {
    if (!name.trim()) throw new Error('Add their name.');
    const fields = {
      name: name.trim(), phone: phone.trim() || null, email: email.trim() || null, source, note: note.trim() || null,
      ...(canAssign ? { assignedStaffId: assigned } : {}),
    };
    if (lead) fill(await updateLead(lead.id, fields));
    else {
      const created = await createLead({ ...fields, phone: fields.phone ?? undefined, email: fields.email ?? undefined, note: fields.note ?? undefined, assignedStaffId: assigned ?? undefined, followUpAt: at10(1) });
      navigation.replace('LeadDetail', { leadId: created.id });
    }
  });

  const setStatus = (status: 'new' | 'contacted' | 'lost') => run('Could not update', async () => {
    fill(await updateLead(lead!.id, status === 'lost' ? { status, followUpAt: null } : { status }));
  });

  const followUp = (iso: string | null) => run('Could not update', async () => {
    fill(await updateLead(lead!.id, { followUpAt: iso, ...(lead!.status === 'new' && iso ? { status: 'contacted' as const } : {}) }));
  });

  const convert = () => Alert.alert('Add as a customer?', `${lead!.name} will be added to your customers. If they're already there with the same phone or email, we'll link to that record instead.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Add customer', onPress: () => run('Could not add customer', async () => { fill(await convertLead(lead!.id)); }) },
  ]);

  const remove = () => Alert.alert('Delete this lead?', 'This can’t be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => run('Could not delete', async () => { await deleteLead(lead!.id); navigation.goBack(); }) },
  ]);

  if (loading) return <View style={[styles.root, { justifyContent: 'center' }]}><ActivityIndicator color={colors.accent} /></View>;

  const open = lead && (lead.status === 'new' || lead.status === 'contacted');
  const won = lead?.status === 'won';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8} accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{lead ? lead.name : 'Add a lead'}</Text>
          {lead && canDelete ? (
            <Pressable onPress={remove} hitSlop={8} accessibilityLabel="Delete lead"><Feather name="trash-2" size={18} color={colors.error} /></Pressable>
          ) : <View style={{ width: 18 }} />}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {lead && (
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <Text style={styles.status}>{LEAD_STATUS_LABELS[lead.status]}</Text>
              {lead.due && <View style={styles.due}><Text style={styles.dueText}>Follow up now</Text></View>}
            </View>
            {lead.followUpAt && open && (
              <Text style={styles.meta}>Follow up {new Date(lead.followUpAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
            )}
            {(lead.phone || lead.email) && (
              <View style={styles.contactRow}>
                {lead.phone && (
                  <Pressable style={styles.contact} onPress={() => Linking.openURL(`tel:${lead.phone}`)} accessibilityRole="button">
                    <Feather name="phone" size={14} color={colors.accent} /><Text style={styles.contactText}>Call</Text>
                  </Pressable>
                )}
                {lead.phone && (
                  <Pressable style={styles.contact} onPress={() => Linking.openURL(`https://wa.me/${waNumber(lead.phone!)}`)} accessibilityRole="button">
                    <Feather name="message-circle" size={14} color={colors.accent} /><Text style={styles.contactText}>WhatsApp</Text>
                  </Pressable>
                )}
                {lead.email && (
                  <Pressable style={styles.contact} onPress={() => Linking.openURL(`mailto:${lead.email}`)} accessibilityRole="button">
                    <Feather name="mail" size={14} color={colors.accent} /><Text style={styles.contactText}>Email</Text>
                  </Pressable>
                )}
              </View>
            )}

            {open && (
              <>
                <Text style={styles.label}>Next follow-up</Text>
                <View style={styles.wrap}>
                  {FOLLOW_UPS.map((f) => (
                    <Pressable key={f.label} style={styles.chip} onPress={() => followUp(at10(f.days))} disabled={busy}>
                      <Text style={styles.chipText}>{f.label}</Text>
                    </Pressable>
                  ))}
                  {lead.followUpAt && (
                    <Pressable style={styles.chip} onPress={() => followUp(null)} disabled={busy}><Text style={styles.chipText}>No follow-up</Text></Pressable>
                  )}
                </View>
                <View style={styles.wrap}>
                  {lead.status === 'new' && (
                    <Pressable style={styles.secondary} onPress={() => setStatus('contacted')} disabled={busy}><Text style={styles.secondaryText}>Mark contacted</Text></Pressable>
                  )}
                  <Pressable style={styles.secondary} onPress={() => setStatus('lost')} disabled={busy}><Text style={styles.secondaryText}>Not interested</Text></Pressable>
                </View>
                <Pressable style={[styles.primary, busy && styles.disabled]} onPress={convert} disabled={busy} accessibilityRole="button">
                  <Text style={styles.primaryText}>They booked — add as a customer</Text>
                </Pressable>
              </>
            )}
            {lead.status === 'lost' && (
              <Pressable style={styles.secondary} onPress={() => setStatus('contacted')} disabled={busy}><Text style={styles.secondaryText}>Reopen</Text></Pressable>
            )}
            {won && lead.customer && (
              <Pressable style={styles.secondary} onPress={() => navigation.navigate('CustomerDetail', { customerId: lead.customer!.id })}>
                <Text style={styles.secondaryText}>View customer</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} editable={!won} placeholder="Who is it?" placeholderTextColor={colors.textMuted} maxLength={120} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} editable={!won} keyboardType="phone-pad" placeholder="0801 234 5678" placeholderTextColor={colors.textMuted} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} editable={!won} keyboardType="email-address" autoCapitalize="none" placeholder="Optional" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Where did they find you?</Text>
        <View style={styles.wrap}>
          {SOURCES.map((s) => (
            <Pressable key={s} onPress={() => setSource(s)} disabled={won} style={[styles.chip, source === s && styles.chipOn]} accessibilityState={{ selected: source === s }}>
              <Text style={[styles.chipText, source === s && styles.chipTextOn]}>{LEAD_SOURCE_LABELS[s]}</Text>
            </Pressable>
          ))}
        </View>

        {canAssign && staff.length > 1 && (
          <>
            <Text style={styles.label}>Who's following up?</Text>
            <View style={styles.wrap}>
              <Pressable onPress={() => setAssigned(null)} disabled={won} style={[styles.chip, assigned === null && styles.chipOn]}>
                <Text style={[styles.chipText, assigned === null && styles.chipTextOn]}>Nobody yet</Text>
              </Pressable>
              {staff.map((m) => (
                <Pressable key={m.id} onPress={() => setAssigned(m.id)} disabled={won} style={[styles.chip, assigned === m.id && styles.chipOn]}>
                  <Text style={[styles.chipText, assigned === m.id && styles.chipTextOn]}>{m.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.multiline]} value={note} onChangeText={setNote} editable={!won} multiline maxLength={1000}
          placeholder="What are they interested in?" placeholderTextColor={colors.textMuted} />

        {!won && (
          <Pressable style={[styles.primary, busy && styles.disabled]} onPress={save} disabled={busy} accessibilityRole="button">
            <Text style={styles.primaryText}>{busy ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}</Text>
          </Pressable>
        )}
        {!lead && <Text style={styles.meta}>We'll remind you to follow up tomorrow.</Text>}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: spacing.md,},
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  back: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: 32, letterSpacing: -0.6, lineHeight: 38, fontWeight: '700', color: colors.text, textAlign: 'center' },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text },
  due: { backgroundColor: colors.amberSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dueText: { fontSize: typography.size.xs, color: colors.warning, fontWeight: typography.weight.bold },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  contactText: { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.sm },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.size.base, color: colors.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.background },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  chipTextOn: { color: colors.white },
  secondary: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center' },
  secondaryText: { color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: spacing.lg, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: typography.weight.bold, fontSize: typography.size.md },
  disabled: { opacity: 0.45 },
  meta: { fontSize: typography.size.sm, color: colors.textMuted },
}));
