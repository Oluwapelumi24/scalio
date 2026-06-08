import type { Booking, Service } from '@scalio/shared-types';
import type { PaymentCheckout } from '../lib/api';

export type RootStackParamList = {
  Onboarding: undefined;
  SignUp: undefined;
  VendorSelection: undefined;
  ServiceSelection: { vendorId: string };
  ScheduleAppointment: { vendorId: string; services: Service[] };
  BookingConfirmation: { booking: Booking; payment: PaymentCheckout | null };
};
