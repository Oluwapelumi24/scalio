import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { InterestSelectionScreen } from '../screens/InterestSelectionScreen';
import { LocationSetupScreen } from '../screens/LocationSetupScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { VendorProfileScreen } from '../screens/VendorProfileScreen';
import { ServiceSelectionScreen } from '../screens/ServiceSelectionScreen';
import { ScheduleAppointmentScreen } from '../screens/ScheduleAppointmentScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { LaundryServiceTypeScreen } from '../screens/LaundryServiceTypeScreen';
import { LaundryBookingScreen } from '../screens/LaundryBookingScreen';
import { LaundryCheckoutScreen } from '../screens/LaundryCheckoutScreen';
import { hasSeenOnboarding } from '../lib/preferences';
import { restoreSession } from '../lib/session';
import { makeStyles, useTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashScreen() {
  const styles = useStyles();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.splash}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={styles.splashWordmark}>scalio</Text>
      </Animated.View>
    </View>
  );
}

export function RootNavigator() {
  const { colors, scheme } = useTheme();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      await restoreSession();
      if (__DEV__) {
        setInitialRoute('Onboarding');
        return;
      }
      const seen = await hasSeenOnboarding();
      setInitialRoute(seen ? 'Main' : 'Onboarding');
    })();
  }, []);

  if (!initialRoute) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
          ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          primary: colors.link,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
        <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="VendorProfile" component={VendorProfileScreen} />
        <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
        <Stack.Screen name="ScheduleAppointment" component={ScheduleAppointmentScreen} />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="BookingSuccess"
          component={BookingSuccessScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="LaundryServiceType" component={LaundryServiceTypeScreen} />
        <Stack.Screen name="LaundryBooking" component={LaundryBookingScreen} />
        <Stack.Screen
          name="LaundryCheckout"
          component={LaundryCheckoutScreen}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Navy splash with the white wordmark, the same in light and dark.
const useStyles = makeStyles((colors) => ({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  splashWordmark: { fontSize: 30, fontWeight: '700', color: colors.onAccent, letterSpacing: 2 },
}));
