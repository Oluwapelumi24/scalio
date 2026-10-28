import { useCallback, useState } from 'react';
import { Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSetupStatus } from '../lib/setup';
import { recordModuleUsage } from '../lib/api';
import { AppTile, Button, Divider, Page, PageHeader, SegmentProgress, StickyFooter, type FeatherName } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

interface Step {
  key: string;
  icon: FeatherName;
  title: string;
  summary: string;
  headline: string;
  body: string;
  done: boolean;
  optional?: boolean;
  open: () => void;
}

/**
 * "Continue setup": one numbered list of what stops clients booking, then a
 * screen per step that explains it before opening the form. Comes back here
 * after each form so the next step is one tap away.
 */
export function SetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const setup = useSetupStatus();
  const [current, setCurrent] = useState<number | null>(null);

  // Back from a form: show the list again with the step ticked off.
  useFocusEffect(useCallback(() => { setCurrent(null); }, []));

  const steps: Step[] = [
    {
      key: 'services',
      icon: 'scissors',
      title: 'Add your services',
      summary: 'What clients can book, with a price and how long it takes.',
      headline: 'Tell clients what you offer',
      body: 'Add each service with its price and duration. Clients pick from this menu when they book, and your calendar uses the duration to keep time free.',
      done: !!setup?.setup.services,
      open: () => navigation.navigate('ServiceForm', {}),
    },
    {
      key: 'hours',
      icon: 'clock',
      title: 'Set your opening hours',
      summary: 'Clients can only book when you are open.',
      headline: 'When can clients book you?',
      body: 'Set the days and times you open. Your calendar shades the hours you are closed, and online booking only offers times inside them.',
      done: !!setup?.setup.hours,
      open: () => navigation.navigate('BusinessHours'),
    },
    {
      key: 'payments',
      icon: 'shield',
      title: 'Take payments online',
      summary: 'Optional. Deposits cut no-shows and go straight to your bank.',
      headline: 'Get paid before clients arrive',
      body: 'Add your bank account so clients can pay a deposit or in full when they book. Money settles straight into your account.',
      done: !!setup?.setup.payments,
      optional: true,
      open: () => navigation.navigate('PaymentsSetup'),
    },
    {
      key: 'share',
      icon: 'share-2',
      title: 'Share your booking link',
      summary: 'Put it on WhatsApp, Instagram and in your bio.',
      headline: 'Get your first booking',
      body: 'Your booking link lets clients see your services and book a free time themselves. Share it wherever your clients already find you.',
      done: (setup?.total ?? 0) > 0,
      open: () => {
        if (!setup?.link) return;
        recordModuleUsage('share_link_first');
        void Share.share({ message: `Book an appointment with us on Scalio: ${setup.link}` });
      },
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.findIndex((s) => !s.done);

  if (current != null) {
    const step = steps[current];
    return (
      <Page
        footer={
          <StickyFooter>
            <Button label={step.key === 'share' ? 'Share link' : 'Continue'} onPress={step.open} style={{ flex: 1 }} />
          </StickyFooter>
        }
      >
        <View style={{ gap: 18 }}>
          <SegmentProgress total={steps.length} current={current} progress={0.15} />
          <PageHeader onBack={() => setCurrent(null)} onClose={() => navigation.goBack()} />
        </View>
        <View style={styles.hero}>
          <AppTile icon={step.icon} size={132} />
        </View>
        <View style={{ gap: 14 }}>
          <Text style={styles.stepLabel}>Step {current + 1}{step.optional ? ' · Optional' : ''}</Text>
          <Text style={styles.huge} accessibilityRole="header">{step.headline}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </View>
      </Page>
    );
  }

  return (
    <Page
      footer={
        <StickyFooter>
          {next === -1 ? (
            <Button label="Done" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          ) : (
            <Button label="Continue" onPress={() => setCurrent(next)} style={{ flex: 1 }} />
          )}
        </StickyFooter>
      }
    >
      <View style={{ gap: 18 }}>
        <SegmentProgress total={steps.length} current={doneCount} progress={0} />
        <PageHeader onClose={() => navigation.goBack()} />
      </View>
      <Text style={styles.headline} accessibilityRole="header">
        A few steps and you're <Text style={{ color: colors.link }}>ready to take bookings</Text>
      </Text>
      <View>
        {steps.map((s, i) => (
          <View key={s.key}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.step}>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.stepHead}>
                  <Text style={[styles.stepNum, s.done && styles.doneText]}>{i + 1}</Text>
                  <Text style={[styles.stepTitle, s.done && styles.doneText]}>{s.title}</Text>
                </View>
                <Text style={styles.stepSummary}>{s.summary}</Text>
                {!s.done ? (
                  <Text style={styles.link} onPress={() => setCurrent(i)}>
                    {s.optional ? 'Set up (optional)' : 'Start'}
                  </Text>
                ) : null}
              </View>
              {s.done ? (
                <View style={styles.doneDisc}><Feather name="check" size={28} color={colors.onAccent} /></View>
              ) : (
                <View style={styles.tileWrap}><AppTile icon={s.icon} size={64} tone={colors.accentLight} glyph={colors.link} /></View>
              )}
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  headline: { fontSize: 22, lineHeight: 29, fontWeight: '700', letterSpacing: -0.6, color: colors.text },
  step: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 24 },
  stepHead: { flexDirection: 'row', alignItems: 'baseline', gap: 14 },
  stepNum: { fontSize: 17, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  stepTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  stepSummary: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, paddingLeft: 30 },
  doneText: { color: colors.textMuted },
  link: { fontSize: 14, fontWeight: '600', color: colors.link, paddingLeft: 30 },
  tileWrap: { borderRadius: 18, padding: 4, backgroundColor: colors.surface },
  doneDisc: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingVertical: 24 },
  stepLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  huge: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8, color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
}));
