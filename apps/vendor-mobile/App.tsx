import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { useFonts, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  // Bundled with the app, so this resolves almost instantly; screens render once it has.
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
