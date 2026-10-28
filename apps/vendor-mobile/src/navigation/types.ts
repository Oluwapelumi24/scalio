import type { VendorBooking, VendorService, Customer, StaffMember, TeamPay, ReportKind } from '../lib/api';
import type { FeatureKey } from '../lib/features';

/** The grouped menus reached from More. */
export type HubKey = 'marketing' | 'money' | 'team';

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
  AdCampaigns: undefined;
  AdCampaignWizard: undefined;
  AdCampaign: { id: string };
  Inbox: undefined;
  InboxChat: { conversationId: string; name?: string };
  InboxSettings: undefined;
  Reports: undefined;
  ReportRecords: { kind: ReportKind; key?: string; title: string; from: string; to: string };
  Feedback: undefined;
  /** The day as a time grid, one column per team member. Opened from More and Home. */
  Calendar: undefined;
  /** Bookings as a list (the calendar's other view). */
  Bookings: undefined;
  /** Sales, what's next and top services: the old home, now one tap away in More. */
  Dashboard: undefined;
  Settings: undefined;
  Hub: { hub: HubKey };
  /** What a feature does, shown until the business starts using it. */
  FeatureIntro: { feature: FeatureKey };
  /** The guided "Continue setup" flow. */
  Setup: undefined;
  /** `at` (ISO) and `staffId` pre-fill when you tap an empty slot on the calendar. */
  NewBooking: { at?: string; staffId?: string } | undefined;
};

export type MainTabParamList = {
  /** The booking-first home in Scalio's own look. */
  Home: undefined;
  Customers: undefined;
  /** The centre + button. It opens the create sheet and never shows a screen of its own. */
  Create: undefined;
  InboxTab: undefined;
  More: undefined;
};
