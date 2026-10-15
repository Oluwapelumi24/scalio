import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { InterestSelectionScreen } from '../screens/InterestSelectionScreen';
import { CustomiseHomeScreen } from '../screens/CustomiseHomeScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';
import { ServiceFormScreen } from '../screens/ServiceFormScreen';
import { CustomerDetailScreen } from '../screens/CustomerDetailScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { BusinessHoursScreen } from '../screens/BusinessHoursScreen';
import { BlackoutDatesScreen } from '../screens/BlackoutDatesScreen';
import { StaffManagementScreen } from '../screens/StaffManagementScreen';
import { StaffFormScreen } from '../screens/StaffFormScreen';
import { loadSession } from '../lib/session';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Login' | 'Main' | null>(null);

  useEffect(() => {
    loadSession().then((session) => {
      setInitialRoute(session ? 'Main' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="CustomiseHome" component={CustomiseHomeScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="ServiceForm" component={ServiceFormScreen} />
        <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
        <Stack.Screen name="BusinessHours" component={BusinessHoursScreen} />
        <Stack.Screen name="BlackoutDates" component={BlackoutDatesScreen} />
        <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
        <Stack.Screen name="StaffForm" component={StaffFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
