export type RootStackParamList = {
  Onboarding: undefined;
  SignUp: undefined;
  VendorSelection: undefined;
  ServiceSelection: { vendorId: string };
  ScheduleAppointment: { vendorId: string; serviceIds: string[] };
  BookingConfirmation: { bookingId: string };
};
