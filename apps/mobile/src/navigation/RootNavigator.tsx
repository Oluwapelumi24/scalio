import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { hasSeenOnboarding } from '../lib/preferences';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { InterestSelectionScreen } from '../screens/InterestSelectionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ServiceSelectionScreen } from '../screens/ServiceSelectionScreen';
import { ScheduleAppointmentScreen } from '../screens/ScheduleAppointmentScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding()
      .then((seen) => {
        if (!cancelled) setInitialRoute(seen ? 'Home' : 'Onboarding');
      })
      .catch(() => {
        if (!cancelled) setInitialRoute('Onboarding');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
        <Stack.Screen name="ScheduleAppointment" component={ScheduleAppointmentScreen} />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
