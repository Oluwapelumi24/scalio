import { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import { StaffScheduleScreen } from '../screens/StaffScheduleScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { PerformanceScreen } from '../screens/PerformanceScreen';
import { PaymentsSetupScreen } from '../screens/PaymentsSetupScreen';
import { PayrollScreen } from '../screens/PayrollScreen';
import { StaffPayScreen } from '../screens/StaffPayScreen';
import { MoneyScreen } from '../screens/MoneyScreen';
import { ContentStudioScreen } from '../screens/ContentStudioScreen';
import { PostEditorScreen } from '../screens/PostEditorScreen';
import { LeadsScreen } from '../screens/LeadsScreen';
import { LeadDetailScreen } from '../screens/LeadDetailScreen';
import { SocialAccountsScreen } from '../screens/SocialAccountsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ReportRecordsScreen } from '../screens/ReportRecordsScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { loadSession, onSessionExpired } from '../lib/session';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Login' | 'Main' | null>(null);

  useEffect(() => {
    loadSession().then((session) => {
      setInitialRoute(session ? 'Main' : 'Onboarding');
    });
  }, []);

  useEffect(() => onSessionExpired(() => {
    if (navigationRef.isReady()) navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }), []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer ref={navigationRef}>
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
        <Stack.Screen name="StaffSchedule" component={StaffScheduleScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Performance" component={PerformanceScreen} />
        <Stack.Screen name="PaymentsSetup" component={PaymentsSetupScreen} />
        <Stack.Screen name="Payroll" component={PayrollScreen} />
        <Stack.Screen name="StaffPay" component={StaffPayScreen} />
        <Stack.Screen name="Money" component={MoneyScreen} />
        <Stack.Screen name="ContentStudio" component={ContentStudioScreen} />
        <Stack.Screen name="PostEditor" component={PostEditorScreen} />
        <Stack.Screen name="Leads" component={LeadsScreen} />
        <Stack.Screen name="LeadDetail" component={LeadDetailScreen} />
        <Stack.Screen name="SocialAccounts" component={SocialAccountsScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="ReportRecords" component={ReportRecordsScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
