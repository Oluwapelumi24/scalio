import type { VendorBooking, VendorService, Customer, StaffMember, TeamPay } from '../lib/api';

export type RootStackParamList = {
  Onboarding: undefined;
  Register: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  InterestSelection: { fromSettings?: boolean } | undefined;
  Main: undefined;
  CustomiseHome: undefined;
  BookingDetail: { booking: VendorBooking };
  Services: undefined;
  ServiceForm: { service?: VendorService };
  CustomerDetail: { customerId: string };
  BusinessHours: undefined;
  BlackoutDates: undefined;
  StaffManagement: undefined;
  StaffForm: { member?: StaffMember };
  StaffSchedule: { staffId: string; name: string };
  Attendance: undefined;
  Performance: undefined;
  PaymentsSetup: undefined;
  Payroll: undefined;
  StaffPay: { staffId: string; name: string; pay: TeamPay };
  Money: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Customers: undefined;
  Settings: undefined;
};
