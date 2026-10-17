import type { VendorBooking, VendorService, Customer, StaffMember, TeamPay, ReportKind } from '../lib/api';

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
  ContentStudio: { tab?: 'draft' | 'planned' | 'posted' } | undefined;
  /** `brief` pre-fills the notes, e.g. from a home suggestion. */
  PostEditor: { postId?: string; brief?: string };
  Leads: { filter?: 'due' | 'open' | 'won' | 'lost' } | undefined;
  LeadDetail: { leadId?: string };
  SocialAccounts: undefined;
  AdsSetup: undefined;
  Reports: undefined;
  ReportRecords: { kind: ReportKind; key?: string; title: string; from: string; to: string };
  Feedback: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Customers: undefined;
  Settings: undefined;
};
