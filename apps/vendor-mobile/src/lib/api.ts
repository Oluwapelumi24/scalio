import { getSession } from './session';

const BASE = 'http://localhost:3000';

// ─── Shared types ────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentMode = 'pay_on_arrival' | 'deposit' | 'full_prepayment';

export interface VendorBooking {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  paymentMode: PaymentMode;
  totalAmountKobo: number;
  customer: { id: string; name: string; email: string } | null;
  services: { id: string; name: string; priceKobo: number }[];
  notes: string | null;
  createdAt: string;
}

export interface VendorService {
  id: string;
  name: string;
  durationMinutes: number;
  priceKobo: number;
  paymentMode: PaymentMode;
  depositPercent: number | null;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  bookingCount: number;
  totalSpentKobo: number;
  lastVisitAt: string | null;
  notes: string | null;
}

export interface BusinessHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface BlackoutDate {
  id: string;
  date: string;
  reason: string | null;
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session) headers['Authorization'] = `Bearer ${session.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  staff: { id: string; name: string; email: string; role: string; vendorId: string };
}

export function vendorLogin(email: string, password: string): Promise<LoginResponse> {
  return req('POST', '/vendor-auth/login', { email, password });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function listBookings(status?: BookingStatus): Promise<VendorBooking[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await req<VendorBooking[]>('GET', `/vendor-admin/bookings${qs}`);
  return (Array.isArray(data) ? data : []).map((b) => ({ ...b, services: b.services ?? [] }));
}

export function completeBooking(id: string): Promise<VendorBooking> {
  return req('POST', `/vendor-admin/bookings/${id}/complete`);
}

export function cancelBooking(id: string, reason?: string): Promise<VendorBooking> {
  return req('POST', `/vendor-admin/bookings/${id}/cancel`, { reason });
}

export function markNoShow(id: string): Promise<VendorBooking> {
  return req('POST', `/vendor-admin/bookings/${id}/no-show`);
}

// ─── Services ────────────────────────────────────────────────────────────────

export function listServices(): Promise<VendorService[]> {
  return req('GET', '/vendor-admin/services');
}

export function createService(data: {
  name: string;
  durationMinutes: number;
  priceKobo: number;
  paymentMode: PaymentMode;
  depositPercent?: number;
}): Promise<VendorService> {
  return req('POST', '/vendor-admin/services', data);
}

export function updateService(id: string, data: Partial<{
  name: string;
  durationMinutes: number;
  priceKobo: number;
  paymentMode: PaymentMode;
  depositPercent: number;
}>): Promise<VendorService> {
  return req('PATCH', `/vendor-admin/services/${id}`, data);
}

export function deleteService(id: string): Promise<void> {
  return req('DELETE', `/vendor-admin/services/${id}`);
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export function listStaff(): Promise<StaffMember[]> {
  return req('GET', '/vendor-admin/staff');
}

export function createStaff(data: { name: string; email: string; password: string; role: string }): Promise<StaffMember> {
  return req('POST', '/vendor-admin/staff', data);
}

export function updateStaff(id: string, data: { name?: string; role?: string }): Promise<StaffMember> {
  return req('PATCH', `/vendor-admin/staff/${id}`, data);
}

export function deleteStaff(id: string): Promise<void> {
  return req('DELETE', `/vendor-admin/staff/${id}`);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export function listCustomers(): Promise<Customer[]> {
  return req('GET', '/vendor-admin/customers');
}

export function getCustomer(id: string): Promise<Customer> {
  return req('GET', `/vendor-admin/customers/${id}`);
}

export function updateCustomerNotes(id: string, notes: string): Promise<Customer> {
  return req('PATCH', `/vendor-admin/customers/${id}/notes`, { notes });
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export function getBusinessHours(): Promise<BusinessHours[]> {
  return req('GET', '/vendor-admin/schedule/hours');
}

export function setBusinessHours(hours: BusinessHours[]): Promise<BusinessHours[]> {
  return req('PUT', '/vendor-admin/schedule/hours', { hours });
}

export function getBlackoutDates(): Promise<BlackoutDate[]> {
  return req('GET', '/vendor-admin/schedule/blackout-dates');
}

export function addBlackoutDate(date: string, reason?: string): Promise<BlackoutDate> {
  return req('POST', '/vendor-admin/schedule/blackout-dates', { date, reason });
}

export function removeBlackoutDate(id: string): Promise<void> {
  return req('DELETE', `/vendor-admin/schedule/blackout-dates/${id}`);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatNaira(kobo: number | null | undefined): string {
  if (kobo == null || isNaN(kobo)) return '₦0';
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
};

export function statusLabel(s: BookingStatus): string {
  return STATUS_LABEL[s] ?? s;
}
