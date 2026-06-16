import type { Booking, Service, Vendor } from '@scalio/shared-types';

// Points at the local NestJS backend during development. Move to app config /
// environment-based URLs once we have staging and production API hosts.
const API_BASE_URL = 'http://localhost:3000';

const HTTP_NO_CONTENT = 204;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }

  // e.g. POST /auth/push-token responds 204 No Content — there's no body to parse.
  if (response.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }

  return response.json();
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
}

export function signUp(name: string, email: string): Promise<AppUser> {
  return request<AppUser>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}

/** Stores the Expo push token for this device once the user grants notification permission. */
export function registerPushToken(userId: string, token: string): Promise<void> {
  return request<void>('/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ userId, token }),
  });
}

export function listVendors(): Promise<Vendor[]> {
  return request<Vendor[]>('/vendors');
}

export function listServices(vendorId: string): Promise<Service[]> {
  return request<Service[]>(`/vendors/${vendorId}/services`);
}

export interface AvailabilityResult {
  date: string;
  durationMinutes: number;
  slots: string[]; // ISO datetime strings
}

export function getAvailability(
  vendorId: string,
  date: string,
  serviceIds: string[],
): Promise<AvailabilityResult> {
  const params = new URLSearchParams({ date });
  if (serviceIds.length > 0) {
    params.set('serviceIds', serviceIds.join(','));
  }
  return request<AvailabilityResult>(`/vendors/${vendorId}/availability?${params.toString()}`);
}

export interface PaymentCheckout {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface CreateBookingInput {
  vendorId: string;
  userId: string;
  serviceIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  staffId?: string;
}

export interface CreateBookingResult {
  booking: Booking;
}

export function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  return request<CreateBookingResult>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      vendorId: input.vendorId,
      userId: input.userId,
      staffId: input.staffId,
      serviceIds: input.serviceIds,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
    }),
  });
}

export interface InitiateBookingPaymentResult {
  booking: Booking;
  payment: PaymentCheckout;
}

/** Upgrades an already-confirmed (pay-on-arrival) booking to a deposit or full prepayment via Paystack. */
export function initiateBookingPayment(
  bookingId: string,
  paymentMode: 'deposit' | 'full_prepayment',
  amountDueKobo: number,
): Promise<InitiateBookingPaymentResult> {
  return request<InitiateBookingPaymentResult>(`/bookings/${bookingId}/payment`, {
    method: 'POST',
    body: JSON.stringify({ paymentMode, amountDueKobo }),
  });
}

export interface BookingWithVendor {
  booking: Booking;
  vendor: Vendor;
}

/** This user's bookings across every vendor, newest first. */
export function listBookings(userId: string): Promise<BookingWithVendor[]> {
  return request<BookingWithVendor[]>(`/bookings?userId=${encodeURIComponent(userId)}`);
}
