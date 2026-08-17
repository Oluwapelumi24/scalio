import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Booking, Service, Vendor } from '@scalio/shared-types';

export type RootStackParamList = {
  Onboarding: undefined;
  InterestSelection: undefined;
  LocationSetup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  // `mode: 'onboarding'` marks this as the final onboarding step (land on
  // Main on success); omitted when reached as a just-in-time booking gate
  // (return the user to where they were instead).
  SignUp: { mode?: 'onboarding' } | undefined;
  SignIn: { mode?: 'onboarding' } | undefined;
  VendorProfile: { vendor: Vendor };
  ServiceSelection: { vendor: Vendor };
  ScheduleAppointment: { vendor: Vendor; services: Service[] };
  BookingConfirmation: { booking: Booking; vendor: Vendor; services: Service[] };
  BookingSuccess: { booking: Booking; vendor: Vendor };
  LaundryServiceType: { vendor: Vendor };
  LaundryBooking: { vendor: Vendor; serviceType: 'self_service' | 'drop_off' };
  LaundryCheckout: {
    vendor: Vendor;
    serviceType: 'self_service' | 'drop_off';
    duvets: number;
    serviceIds: string[];
    slotISO: string;
    slotLabel: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Appointments: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
