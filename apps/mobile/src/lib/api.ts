import type { Booking, Service, Vendor } from '@scalio/shared-types';

// Points at the local NestJS backend during development. Move to app config /
// environment-based URLs once we have staging and production API hosts.
const API_BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${response.status})`);
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

export interface CreateBookingInput {
  vendorId: string;
  userId: string;
  serviceIds: string[];
  scheduledAt: string;
  durationMinutes: number;
  staffId?: string;
}

export function createBooking(input: CreateBookingInput): Promise<Booking> {
  return request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      vendorId: input.vendorId,
      userId: input.userId,
      staffId: input.staffId,
      serviceIds: input.serviceIds,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      paymentMode: 'pay_on_arrival',
      amountDueKobo: 0,
    }),
  });
}
