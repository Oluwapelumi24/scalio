import { expireSession, getSession } from './session';

const BASE = 'http://localhost:3000';

// ─── Shared types ────────────────────────────────────────────────────────────

export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_vendor' | 'no_show';
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
  // A 401 on a signed-in request means the token expired or was revoked.
  if (res.status === 401 && session) {
    await expireSession();
    throw new Error('Your session has ended. Please sign in again.');
  }
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

export function vendorRegister(ownerName: string, businessName: string, email: string, password: string, registrationNumber?: string): Promise<LoginResponse> {
  return req('POST', '/vendor-auth/register', { ownerName, businessName, email, password, ...(registrationNumber ? { registrationNumber } : {}) });
}

export function requestPasswordReset(email: string): Promise<void> {
  return req('POST', '/vendor-auth/forgot-password', { email });
}

export function resetPassword(email: string, code: string, password: string): Promise<LoginResponse> {
  return req('POST', '/vendor-auth/reset-password', { email, code, password });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function listBookings(status?: BookingStatus): Promise<VendorBooking[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await req<VendorBooking[]>('GET', `/vendor-admin/bookings${qs}`);
  return (Array.isArray(data) ? data : []).map((b) => ({ ...b, services: b.services ?? [] }));
}

export interface TodaySummary {
  date: string;
  bookings: number;
  /** Null for roles that don't see money. */
  salesKobo: number | null;
}

export function getTodaySummary(): Promise<TodaySummary> {
  return req('GET', '/vendor-admin/bookings/summary');
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

// ─── Staff schedules, attendance, performance ───────────────────────────────

export interface StaffDay {
  dayOfWeek: number;
  startsAtMinutes: number;
  endsAtMinutes: number;
  breakStartsAtMinutes: number | null;
  breakEndsAtMinutes: number | null;
}

export interface TimeOff {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface StaffSchedule {
  staffId: string;
  name: string;
  days: StaffDay[];
  timeOff: TimeOff[];
}

export function getStaffSchedule(staffId: string): Promise<StaffSchedule> {
  return req('GET', `/vendor-admin/staff/${staffId}/schedule`);
}

export function setStaffSchedule(staffId: string, days: StaffDay[]): Promise<StaffSchedule> {
  return req('PUT', `/vendor-admin/staff/${staffId}/schedule`, {
    days: days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      startsAtMinutes: d.startsAtMinutes,
      endsAtMinutes: d.endsAtMinutes,
      ...(d.breakStartsAtMinutes != null && d.breakEndsAtMinutes != null
        ? { breakStartsAtMinutes: d.breakStartsAtMinutes, breakEndsAtMinutes: d.breakEndsAtMinutes }
        : {}),
    })),
  });
}

export function addTimeOff(staffId: string, startDate: string, endDate: string, reason?: string): Promise<TimeOff> {
  return req('POST', `/vendor-admin/staff/${staffId}/time-off`, { startDate, endDate, reason });
}

export function removeTimeOff(staffId: string, timeOffId: string): Promise<void> {
  return req('DELETE', `/vendor-admin/staff/${staffId}/time-off/${timeOffId}`);
}

export interface ShiftStatus { staffId: string; clockedIn: boolean; since: string | null }
export interface TeamShiftStatus { id: string; name: string; role: string; clockedIn: boolean; since: string | null }

export function getMyShift(): Promise<ShiftStatus> {
  return req('GET', '/vendor-admin/attendance/me');
}

export function getTeamShifts(): Promise<TeamShiftStatus[]> {
  return req('GET', '/vendor-admin/attendance/team');
}

/** Omit `staffId` to clock yourself in; owners and managers may name someone else. */
export function clockIn(staffId?: string): Promise<unknown> {
  return req('POST', '/vendor-admin/attendance/clock-in', staffId ? { staffId } : {});
}

export function clockOut(staffId?: string): Promise<unknown> {
  return req('POST', '/vendor-admin/attendance/clock-out', staffId ? { staffId } : {});
}

export interface StaffPerformance {
  staffId: string | null;
  name: string;
  role: string | null;
  bookings: number;
  completed: number;
  noShows: number;
  cancelledByBusiness: number;
  cancelledByCustomer: number;
  upcoming: number;
  salesKobo: number;
  averageSaleKobo: number | null;
  completionRate: number | null;
  uniqueCustomers: number;
  repeatCustomers: number;
  attendance: { workedMinutes: number; scheduledMinutes: number | null; rate: number | null; clockedInNow: boolean } | null;
}

export interface PerformanceReport {
  from: string;
  to: string;
  definitions: Record<string, string>;
  tracksAttendance: boolean;
  staff: StaffPerformance[];
}

export function getPerformance(from: string, to: string): Promise<PerformanceReport> {
  return req('GET', `/vendor-admin/performance?from=${from}&to=${to}`);
}

export function minutesToClock(m: number): string {
  const h = Math.floor(m / 60);
  const min = String(m % 60).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${min}${h >= 12 && h < 24 ? 'pm' : 'am'}`;
}

// ─── Money: payments, payroll, expenses ──────────────────────────────────────
// Scalio never holds money: online payments settle to the vendor's own bank, and
// salaries are paid from the owner's bank, then recorded here.

export interface Bank { name: string; code: string }

export interface PayoutAccount {
  bankName: string;
  accountLast4: string;
  accountName: string;
  onlinePaymentsEnabled: boolean;
  verifiedAt: string;
}

export function getBanks(): Promise<Bank[]> {
  return req('GET', '/vendor-admin/payments/banks');
}

export function resolveAccount(bankCode: string, accountNumber: string): Promise<{ accountName: string }> {
  return req('POST', '/vendor-admin/payments/resolve-account', { bankCode, accountNumber });
}

export function getPayoutAccount(): Promise<PayoutAccount | null> {
  return req('GET', '/vendor-admin/payments/account');
}

export function setPayoutAccount(bankCode: string, accountNumber: string): Promise<PayoutAccount> {
  return req('PUT', '/vendor-admin/payments/account', { bankCode, accountNumber });
}

export interface SalaryWindow {
  state: 'not_set_up' | 'paused' | 'open' | 'closed';
  period: string | null;
  payDate: string | null;
  opensOn: string | null;
  closesOn: string | null;
  reason: string;
}

export interface PayrollSchedule { payDay: number; opensDaysBefore: number; closesDaysAfter: number; paused: boolean }

export interface TeamPay {
  staffId: string;
  name: string;
  role: string;
  monthlySalaryKobo: number | null;
  bankName: string | null;
  accountLast4: string | null;
  accountName: string | null;
  verifiedAt: string | null;
}

export interface SalaryPayout {
  id: string;
  staffName: string;
  amountKobo: number;
  bankName: string;
  accountLast4: string;
  accountName: string;
  accountNumber?: string;
  status: 'pending' | 'paid' | 'skipped';
  reference: string | null;
  paidAt: string | null;
}

export interface SalaryRun {
  id: string;
  period: string;
  status: 'open' | 'completed';
  totalKobo: number;
  paidKobo: number;
  payouts: SalaryPayout[];
}

export interface PayrollOverview {
  schedule: PayrollSchedule | null;
  window: SalaryWindow;
  team: TeamPay[];
  totals: { monthlyKobo: number; people: number };
  canStart: boolean;
  blockedReason: string | null;
  currentRun: SalaryRun | null;
}

export function getPayroll(): Promise<PayrollOverview> {
  return req('GET', '/vendor-admin/payroll');
}

export function setPayrollSchedule(data: { payDay: number; paused?: boolean }): Promise<PayrollOverview> {
  return req('PUT', '/vendor-admin/payroll/schedule', data);
}

export function setStaffPay(staffId: string, data: { monthlySalaryKobo?: number; bankCode?: string; accountNumber?: string }): Promise<PayrollOverview> {
  return req('PUT', `/vendor-admin/payroll/staff/${staffId}`, data);
}

export function startPayroll(): Promise<SalaryRun> {
  return req('POST', '/vendor-admin/payroll/runs');
}

export function getTransferList(runId: string): Promise<SalaryRun> {
  return req('GET', `/vendor-admin/payroll/runs/${runId}/transfer-list`);
}

export function markPayoutPaid(payoutId: string, reference?: string): Promise<SalaryRun> {
  return req('POST', `/vendor-admin/payroll/payouts/${payoutId}/paid`, reference ? { reference } : {});
}

export function skipPayout(payoutId: string): Promise<SalaryRun> {
  return req('POST', `/vendor-admin/payroll/payouts/${payoutId}/skip`, {});
}

export interface MoneySummary {
  from: string;
  to: string;
  salesKobo: number;
  receivedOnlineKobo: number;
  salariesKobo: number;
  expensesKobo: number;
  netKobo: number;
}

export interface LedgerEntry { id: string; kind: string; direction: 'in' | 'out'; amountKobo: number; occurredAt: string; description: string }
export interface Expense { id: string; amountKobo: number; category: string; spentOn: string; note: string | null }

export function getMoneySummary(from: string, to: string): Promise<MoneySummary> {
  return req('GET', `/vendor-admin/money/summary?from=${from}&to=${to}`);
}

export function getLedger(from: string, to: string): Promise<LedgerEntry[]> {
  return req('GET', `/vendor-admin/money/ledger?from=${from}&to=${to}`);
}

export function listExpenses(from: string, to: string): Promise<Expense[]> {
  return req('GET', `/vendor-admin/money/expenses?from=${from}&to=${to}`);
}

export function getExpenseCategories(): Promise<string[]> {
  return req('GET', '/vendor-admin/money/expense-categories');
}

export function addExpense(data: { amountKobo: number; category: string; spentOn: string; note?: string }): Promise<Expense> {
  return req('POST', '/vendor-admin/money/expenses', data);
}

export function voidExpense(id: string): Promise<void> {
  return req('POST', `/vendor-admin/money/expenses/${id}/void`, {});
}

/** ₦ with thousands separators, from kobo. */
export function naira(kobo: number): string {
  // `|| 0` turns -0 into 0, so a zero total never shows as "₦-0".
  return `₦${(kobo / 100 || 0).toLocaleString('en-NG')}`;
}

/** 'YYYY-MM' → 'October 2026'. */
export function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
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

// ─── Personalisation ─────────────────────────────────────────────────────────

export type HomeLayer = 'attention' | 'overview' | 'quick_action' | 'recommendation';

export interface Interest { id: string; label: string; icon: string }
export interface InterestGroup { id: string; title: string; interests: Interest[] }

export interface Preferences {
  interests: string[];
  pinnedModules: string[];
  hiddenModules: string[];
  interestsCompletedAt: string | null;
}

export interface HomeItem {
  id: string;
  layer: HomeLayer;
  title: string;
  icon: string;
  status: 'available' | 'coming_soon';
  pinned: boolean;
  data: Record<string, any>;
}

export interface HomeResponse {
  generatedAt: string;
  business: { name: string };
  layers: Record<HomeLayer, HomeItem[]>;
  hidden: Pick<HomeItem, 'id' | 'layer' | 'title' | 'icon'>[];
}

export function getInterestGroups(): Promise<InterestGroup[]> {
  return req('GET', '/vendor-admin/personalisation/interests');
}

export function getPreferences(): Promise<Preferences> {
  return req('GET', '/vendor-admin/preferences');
}

export function updatePreferences(data: Partial<{
  interests: string[];
  pinnedModules: string[];
  hiddenModules: string[];
  completeInterests: boolean;
}>): Promise<Preferences> {
  return req('PUT', '/vendor-admin/preferences', data);
}

export function resetHome(): Promise<Preferences> {
  return req('POST', '/vendor-admin/preferences/reset-home');
}

export function getHome(): Promise<HomeResponse> {
  return req('GET', '/vendor-admin/home');
}

/** Best-effort: usage only nudges ranking, so a failed call is ignored. */
export function recordModuleUsage(moduleId: string): void {
  req('POST', '/vendor-admin/home/usage', { moduleId }).catch(() => {});
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatNaira(kobo: number | null | undefined): string {
  if (kobo == null || isNaN(kobo)) return 'NGN 0';
  const amount = kobo / 100;
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const withCommas = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cents > 0
    ? `NGN ${withCommas}.${cents.toString().padStart(2, '0')}`
    : `NGN ${withCommas}`;
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
  pending_payment: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_vendor: 'Cancelled',
  no_show: 'No-show',
};

export function statusLabel(s: BookingStatus): string {
  return STATUS_LABEL[s] ?? s;
}
