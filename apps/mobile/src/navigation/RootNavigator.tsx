import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { hasSeenOnboarding } from '../lib/preferences';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { InterestSelectionScreen } from '../screens/InterestSelectionScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { SignUpScreen } from '../screens/SignUpScreen';
import { VendorProfileScreen } from '../screens/VendorProfileScreen';
import { ServiceSelectionScreen } from '../screens/ServiceSelectionScreen';
import { ScheduleAppointmentScreen } from '../screens/ScheduleAppointmentScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { typography } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.splash}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={styles.splashWordmark}>scalio</Text>
      </Animated.View>
    </LinearGradient>
  );
}

export function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding()
      .then((seen) => {
        if (!cancelled) setInitialRoute(seen ? 'Main' : 'Onboarding');
      })
      .catch(() => {
        if (!cancelled) setInitialRoute('Onboarding');
      });
    return () => { cancelled = true; };
  }, []);

  if (!initialRoute) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashWordmark: {
    fontSize: 40,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
    letterSpacing: 2,
  },
});
