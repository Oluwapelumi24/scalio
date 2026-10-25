import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { FEATURES, markFeatureStarted } from '../lib/features';
import { AppTile, Button, CheckItem, Page, PageHeader, StickyFooter } from '../components/ui';
import { makeStyles, useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FeatureIntro'>;

const EYEBROW = {
  included: 'INCLUDED IN YOUR PLAN',
  new: 'NEW FEATURE',
  soon: 'Coming soon',
} as const;

/**
 * What an advanced feature does, shown the first time someone opens it.
 * "Start now" remembers the choice and opens the feature itself.
 */
export function FeatureIntroScreen({ navigation, route }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const f = FEATURES[route.params.feature];
  const soon = f.eyebrow === 'soon';

  async function start() {
    await markFeatureStarted(f.key);
    navigation.replace(...([f.route] as unknown as Parameters<typeof navigation.replace>));
  }

  return (
    <Page
      footer={
        <StickyFooter>
          <Button label="Not now" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          {soon ? null : <Button label={f.cta} onPress={() => void start()} style={{ flex: 1 }} />}
        </StickyFooter>
      }
    >
      <PageHeader
        onBack={() => navigation.goBack()}
        eyebrow={
          <View style={{ gap: 18 }}>
            {soon ? (
              <View style={styles.soon}><Text style={styles.soonText}>{EYEBROW.soon}</Text></View>
            ) : (
              <Text style={[styles.eyebrow, { color: f.eyebrow === 'new' ? colors.link : colors.success }]}>{EYEBROW[f.eyebrow]}</Text>
            )}
            <View style={styles.app}>
              <AppTile icon={f.icon} size={52} />
              <Text style={styles.appName}>{f.name}</Text>
            </View>
          </View>
        }
        title={f.headline}
      />
      <Text style={styles.body}>{f.body}</Text>
      <View style={{ gap: 18 }}>
        {f.bullets.map((b) => <CheckItem key={b} text={b} />)}
      </View>

      {/* The example card: what this looks like once it's running */}
      <LinearGradient
        colors={scheme === 'dark' ? ['#2c48b8', '#5b78f0'] : ['#1e3a8a', '#3f5fd9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.preview}
      >
        <Text style={styles.previewTitle}>{f.preview.title}</Text>
        <Text style={styles.previewSub}>{f.preview.sub}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.previewFigure}>{f.preview.figure}</Text>
        <Text style={styles.previewNote}>{f.preview.note}</Text>
      </LinearGradient>
    </Page>
  );
}

const useStyles = makeStyles((colors) => ({
  eyebrow: { fontSize: 15, fontWeight: '600', letterSpacing: 0.8 },
  soon: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.tip, borderWidth: 1, borderColor: colors.tipBorder },
  soonText: { fontSize: 15, fontWeight: '600', color: colors.link },
  app: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  appName: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 17, lineHeight: 25, color: colors.text },
  preview: { alignSelf: 'center', width: '88%', minHeight: 190, borderRadius: 24, padding: 24, marginTop: 8 },
  previewTitle: { fontSize: 24, fontWeight: '700', color: colors.white },
  previewSub: { fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  previewFigure: { fontSize: 28, fontWeight: '700', color: colors.white, textAlign: 'right' },
  previewNote: { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'right', marginTop: 2 },
}));
