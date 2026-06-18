import type { VendorBooking, VendorService, Customer, StaffMember } from '../lib/api';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  BookingDetail: { booking: VendorBooking };
  Services: undefined;
  ServiceForm: { service?: VendorService };
  CustomerDetail: { customerId: string };
  BusinessHours: undefined;
  BlackoutDates: undefined;
  StaffManagement: undefined;
  StaffForm: { member?: StaffMember };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  Customers: undefined;
  Settings: undefined;
};
