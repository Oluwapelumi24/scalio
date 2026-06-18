import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
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
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main' | null>(null);

  useEffect(() => {
    loadSession().then((s) => setInitialRoute(s ? 'Main' : 'Login'));
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
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
