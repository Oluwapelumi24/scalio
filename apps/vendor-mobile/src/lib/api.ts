import { expireSession, getSession } from './session';

export const BASE = 'http://localhost:3000';

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
  /** Who it's with. Null when anyone can take it. */
  staff?: { id: string; name: string } | null;
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

/** Bookings that start inside a window, for the calendar. */
export async function listBookingsBetween(from: Date, to: Date): Promise<VendorBooking[]> {
  const qs = `?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
  const data = await req<VendorBooking[]>('GET', `/vendor-admin/bookings${qs}`);
  return (Array.isArray(data) ? data : []).map((b) => ({ ...b, services: b.services ?? [] }));
}

/** Book a client in from the app: an existing client, or a new walk-in by name (and phone). */
export function createBooking(data: {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId?: string;
  serviceIds: string[];
  scheduledAt: string;
}): Promise<{ id: string }> {
  return req('POST', '/vendor-admin/bookings', data);
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
  /** Customer ratings for this person's bookings in the period; null when nobody rated. */
  rating: { average: number; count: number } | null;
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

/** The API stores open days as minutes since midnight and leaves closed days out. */
interface HoursRow { dayOfWeek: number; opensAtMinutes: number; closesAtMinutes: number }

const toClock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** The whole week, Sunday first. Empty when the business hasn't set any hours yet. */
export async function getBusinessHours(): Promise<BusinessHours[]> {
  const rows = await req<HoursRow[]>('GET', '/vendor-admin/schedule/hours');
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return Array.from({ length: 7 }, (_, day) => {
    const r = rows.find((x) => x.dayOfWeek === day);
    return r
      ? { dayOfWeek: day, openTime: toClock(r.opensAtMinutes), closeTime: toClock(r.closesAtMinutes), isClosed: false }
      : { dayOfWeek: day, openTime: '09:00', closeTime: '18:00', isClosed: true };
  });
}

export async function setBusinessHours(hours: BusinessHours[]): Promise<BusinessHours[]> {
  const days = hours
    .filter((h) => !h.isClosed)
    .map((h) => ({ dayOfWeek: h.dayOfWeek, opensAtMinutes: toMins(h.openTime), closesAtMinutes: toMins(h.closeTime) }));
  await req('PUT', '/vendor-admin/schedule/hours', { days });
  return getBusinessHours();
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
  /** The basics, always present whatever the business's interests or home settings. */
  bookings: {
    link: string;
    upcoming: { id: string; customerName: string | null; scheduledAt: string; status: string }[];
    total: number;
    setup: { services: boolean; hours: boolean; payments: boolean };
  };
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

// ─── Growth: content studio and leads ────────────────────────────────────────
// Posting to Instagram/Facebook/TikTok is manual until those platforms approve
// Scalio; the backend says so per platform in `manualReason`.

export type ContentPlatform = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp';
export type PostStatus = 'draft' | 'planned' | 'posted';

export interface PlatformSpec {
  id: ContentPlatform;
  name: string;
  captionMaxChars: number;
  hashtagMax: number;
  needsMedia: boolean;
  /** Per business: `automatic` once its account is connected. */
  publishing: 'manual' | 'automatic';
  manualReason: string;
  connection: { displayName: string; status: 'active' | 'needs_reconnect'; lastError: string | null } | null;
  canConnect: boolean;
}

export type PublicationStatus = 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled';
export interface Publication {
  id: string;
  platform: 'facebook' | 'instagram';
  status: PublicationStatus;
  runAt: string;
  attempts: number;
  permalink: string | null;
  error: string | null;
  publishedAt: string | null;
}

export interface StudioInfo {
  ai: { available: boolean; dailyLimit: number; usedToday: number };
  tones: { id: string; label: string }[];
  platforms: PlatformSpec[];
}

export interface PlatformCheck { platform: ContentPlatform; text: string; problems: string[]; notes: string[] }

export interface ContentPost {
  id: string;
  mediaId: string | null;
  brief: string | null;
  tone: string | null;
  caption: string;
  hashtags: string[];
  callToAction: string | null;
  platforms: ContentPlatform[];
  status: PostStatus;
  plannedFor: string | null;
  postedAt: string | null;
  postedPlatforms: ContentPlatform[];
  aiGenerated: boolean;
  updatedAt: string;
  checks: PlatformCheck[];
  publications: Publication[];
}

export interface CaptionDraft { caption: string; hashtags: string[]; callToAction: string }

export interface PostFields {
  mediaId?: string | null;
  brief?: string | null;
  tone?: string | null;
  caption?: string;
  hashtags?: string[];
  callToAction?: string | null;
  platforms?: ContentPlatform[];
  aiGenerated?: boolean;
}

export function getStudio(): Promise<StudioInfo> {
  return req('GET', '/vendor-admin/content/studio');
}

export function uploadMedia(mimeType: string, dataBase64: string): Promise<{ id: string; mimeType: string; byteSize: number }> {
  return req('POST', '/vendor-admin/content/media', { mimeType, dataBase64 });
}

/** Source for <Image>: the photo is behind sign-in, so it carries the session header. */
export function mediaSource(id: string) {
  const session = getSession();
  return { uri: `${BASE}/vendor-admin/content/media/${id}`, headers: session ? { Authorization: `Bearer ${session.token}` } : undefined };
}

export function writeCaption(data: { brief?: string; tone: string; platforms: ContentPlatform[]; mediaId?: string }): Promise<CaptionDraft> {
  return req('POST', '/vendor-admin/content/captions', data);
}

export function listPosts(params: { status?: PostStatus; from?: string; to?: string } = {}): Promise<ContentPost[]> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return req('GET', `/vendor-admin/content/posts${qs ? `?${qs}` : ''}`);
}

export function getPost(id: string): Promise<ContentPost> {
  return req('GET', `/vendor-admin/content/posts/${id}`);
}

export function createPost(fields: PostFields): Promise<ContentPost> {
  return req('POST', '/vendor-admin/content/posts', fields);
}

export function updatePost(id: string, fields: PostFields): Promise<ContentPost> {
  return req('PATCH', `/vendor-admin/content/posts/${id}`, fields);
}

export function planPost(id: string, plannedFor: string): Promise<ContentPost> {
  return req('POST', `/vendor-admin/content/posts/${id}/plan`, { plannedFor });
}

export function unplanPost(id: string): Promise<ContentPost> {
  return req('POST', `/vendor-admin/content/posts/${id}/unplan`, {});
}

export function markPosted(id: string, platforms: ContentPlatform[]): Promise<ContentPost> {
  return req('POST', `/vendor-admin/content/posts/${id}/posted`, { platforms });
}

export function deletePost(id: string): Promise<void> {
  return req('DELETE', `/vendor-admin/content/posts/${id}`);
}

export interface SocialConnections {
  available: boolean;
  unavailableReason: string | null;
  connections: { platform: 'facebook' | 'instagram'; displayName: string; status: 'active' | 'needs_reconnect'; lastError: string | null; connectedAt: string }[];
}

export function getSocialConnections(): Promise<SocialConnections> {
  return req('GET', '/vendor-admin/social/connections');
}

/** The Facebook Login page to open in the browser. */
export function metaConnectUrl(): Promise<{ url: string }> {
  return req('POST', '/vendor-admin/social/meta/connect', { from: 'mobile' });
}

export function disconnectMeta(): Promise<void> {
  return req('DELETE', '/vendor-admin/social/meta');
}

// ── Ads Manager ──────────────────────────────────────────────────────────────

export type AdsStepAction =
  | { kind: 'connect' }
  | { kind: 'choose_ad_account' }
  | { kind: 'open_url'; url: string; label: string };

export interface AdsSetupStep {
  key: 'facebook' | 'instagram' | 'ad_access' | 'ad_account' | 'payment_method' | 'whatsapp';
  title: string;
  state: 'done' | 'todo' | 'attention' | 'waiting' | 'coming_soon';
  detail: string;
  optional: boolean;
  action: AdsStepAction | null;
}

export interface AdsSetup {
  available: boolean;
  unavailableReason: string | null;
  ready: boolean;
  steps: AdsSetupStep[];
}

export interface MetaAdAccountOption {
  id: string;
  name: string;
  currency: string;
  businessName: string | null;
  hasPaymentMethod: boolean;
  paymentMethodLabel: string | null;
  /** Why it can't run ads right now, or null. */
  problem: string | null;
  chosen: boolean;
}

export function getAdsSetup(): Promise<AdsSetup> {
  return req('GET', '/vendor-admin/ads/setup');
}

export function getMetaAdAccounts(): Promise<MetaAdAccountOption[]> {
  return req('GET', '/vendor-admin/ads/ad-accounts');
}

export function chooseAdAccount(adAccountId: string): Promise<AdsSetup> {
  return req('PUT', '/vendor-admin/ads/ad-account', { adAccountId });
}

/** Re-checks the ad account with Meta, e.g. after adding a card there. */
export function refreshAdAccount(): Promise<AdsSetup> {
  return req('POST', '/vendor-admin/ads/ad-account/refresh', {});
}

// ── Inbox (Ads Manager Phase 2) ──────────────────────────────────────────────

export type InboxChannel = 'instagram' | 'messenger' | 'whatsapp';
export type AiReplyMode = 'off' | 'suggest' | 'reply';
export type HandoffReason = 'complaint' | 'refund' | 'unknown' | 'human_requested';

/** open: free replies; human_agent: a person may reply until closesAt; template: WhatsApp needs a paid template; closed/none: can't reply. */
export interface ReplyWindow {
  state: 'open' | 'human_agent' | 'template' | 'closed' | 'none';
  closesAt: string | null;
}

export interface InboxConversation {
  id: string;
  channel: InboxChannel;
  customerName: string;
  preview: string | null;
  lastMessageAt: string;
  unreadCount: number;
  window: ReplyWindow;
  aiMode: AiReplyMode;
  aiPaused: boolean;
  leadId: string | null;
  /** Set when the chat started from an ad. */
  adTitle: string | null;
  handoff: { reason: HandoffReason; label: string; at: string } | null;
}

export interface InboxMessage {
  id: string;
  direction: 'in' | 'out';
  sentBy: 'customer' | 'vendor' | 'ai';
  text: string;
  attachments: { type: string; url: string | null }[];
  status: 'received' | 'sent' | 'failed';
  humanAgentTag: boolean;
  sentAt: string;
}

export interface InboxConversationDetail extends InboxConversation {
  aiSuggestion: string | null;
  messages: InboxMessage[];
}

export interface FaqEntry { question: string; answer: string }

export interface InboxSettings {
  aiAvailable: boolean;
  channels: { channel: InboxChannel; connected: boolean; accountName: string | null; comingSoon: boolean; mode: AiReplyMode }[];
  faq: FaqEntry[];
}

export const CHANNEL_LABELS: Record<InboxChannel, string> = { instagram: 'Instagram', messenger: 'Messenger', whatsapp: 'WhatsApp' };
export const AI_MODE_LABELS: Record<AiReplyMode, string> = { off: 'Off', suggest: 'Suggest, I send', reply: 'Reply for me' };

export function listConversations(filter: 'all' | 'needs_you' = 'all'): Promise<InboxConversation[]> {
  return req('GET', `/vendor-admin/inbox/conversations?filter=${filter}`);
}

export function getConversation(id: string): Promise<InboxConversationDetail> {
  return req('GET', `/vendor-admin/inbox/conversations/${id}`);
}

export function sendInboxReply(id: string, text: string): Promise<InboxConversationDetail> {
  return req('POST', `/vendor-admin/inbox/conversations/${id}/messages`, { text });
}

export function suggestInboxReply(id: string): Promise<{ suggestion: string | null; handoff: { reason: HandoffReason; label: string } | null }> {
  return req('POST', `/vendor-admin/inbox/conversations/${id}/suggest`, {});
}

/** paused: false hands the chat back to the AI and clears "Needs you". */
export function setConversationAiPaused(id: string, paused: boolean): Promise<InboxConversationDetail> {
  return req('PUT', `/vendor-admin/inbox/conversations/${id}/ai`, { paused });
}

export function getInboxSettings(): Promise<InboxSettings> {
  return req('GET', '/vendor-admin/inbox/settings');
}

export function updateInboxSettings(patch: { aiModes?: Partial<Record<InboxChannel, AiReplyMode>>; faq?: FaqEntry[] }): Promise<InboxSettings> {
  return req('PUT', '/vendor-admin/inbox/settings', patch);
}

export function draftInboxFaq(): Promise<{ faq: FaqEntry[] }> {
  return req('POST', '/vendor-admin/inbox/faq/draft', {});
}

// ── Ads Manager: campaigns ───────────────────────────────────────────────────

export type AdObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'app_promotion' | 'sales';
export type AdDestination = 'whatsapp' | 'messenger' | 'instagram_direct' | 'website' | 'app';
export type AdPaymentRoute = 'scalio' | 'own_meta';
export type AdCampaignStatus = 'awaiting_payment' | 'launching' | 'in_review' | 'active' | 'paused' | 'completed' | 'rejected' | 'failed' | 'cancelled';

export interface AdLocation { key: string; type: 'city' | 'region' | 'country'; name: string; radiusKm?: number }
export interface AdTargeting {
  locations: AdLocation[];
  ageMin: number;
  ageMax: number;
  genders: 'all' | 'male' | 'female';
  interests: { id: string; name: string }[];
  placements: 'automatic' | { facebook: string[]; instagram: string[]; messenger: string[] };
}
export interface AdCreativeFields {
  mediaId: string;
  primaryText: string;
  headline: string;
  description: string | null;
  link: string | null;
  welcomeMessage: string | null;
  iceBreakers: string[];
}
export interface AdExtras { pixelId?: string; appId?: string; appStoreUrl?: string }

export interface AdObjectiveOption { id: AdObjective; label: string; blurb: string; bestFor: string; destinations: AdDestination[]; simple: boolean }
export interface AdRoutes {
  scalio: { available: boolean; reason: string | null };
  own_meta: { available: boolean; reason: string | null; adAccountName: string | null; paymentMethodLabel: string | null };
}

export interface AdBuilder {
  name: string;
  objective: AdObjective;
  destination: AdDestination;
  targeting: AdTargeting;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  days: number;
  bookingLink: string;
  pageName: string | null;
  instagramName: string | null;
  objectives: AdObjectiveOption[];
  fee: { percent: number; minKobo: number };
  creditKobo: number;
  routes: AdRoutes;
  aiAvailable: boolean;
}

export interface AdQuote {
  route: AdPaymentRoute;
  days: number;
  dailyBudgetKobo: number;
  spendKobo: number;
  vatKobo: number;
  feeKobo: number;
  creditUsedKobo: number;
  dueNowKobo: number;
  metaChargesKobo: number;
}

export interface AdCopyDraft {
  variants: { angle: string; primaryText: string; headline: string; description: string }[];
  welcomeMessage: string;
  iceBreakers: string[];
}

export interface InterestOption { id: string; name: string; audienceSize: number | null; topic: string | null }
export interface LocationOption { key: string; type: 'city' | 'region' | 'country'; name: string; label: string }

export interface AdCampaign {
  id: string;
  name: string;
  mode: 'simple' | 'advanced';
  objective: AdObjective;
  objectiveLabel: string;
  destination: AdDestination;
  route: AdPaymentRoute;
  status: AdCampaignStatus;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  days: number;
  paidSpendKobo: number;
  spentKobo: number;
  targeting: AdTargeting;
  creative: AdCreativeFields;
  mediaId: string | null;
  reviewNote: string | null;
  lastError: string | null;
  launchedAt: string | null;
  createdAt: string;
}

export interface AdCampaignDetail extends AdCampaign {
  payments: { id: string; purpose: 'launch' | 'extend'; extraDays: number | null; status: 'pending' | 'paid' | 'failed'; amountDueKobo: number; paidAt: string | null }[];
  quoteForExtension: Record<string, AdQuote>;
}

export interface NewAdCampaign {
  name: string;
  mode: 'simple' | 'advanced';
  objective: AdObjective;
  destination: AdDestination;
  route: AdPaymentRoute;
  dailyBudgetKobo: number;
  startAt: string;
  endAt: string;
  targeting: AdTargeting;
  creative: AdCreativeFields;
  extras: AdExtras;
}

export interface AdCheckout { paid: boolean; authorizationUrl: string | null; quote: AdQuote; campaign: AdCampaign }

export const getAdBuilder = (): Promise<AdBuilder> => req('GET', '/vendor-admin/ads/builder');
export const searchAdInterests = (q: string): Promise<InterestOption[]> => req('GET', `/vendor-admin/ads/targeting/interests?q=${encodeURIComponent(q)}`);
export const suggestAdInterests = (names: string[]): Promise<InterestOption[]> =>
  req('GET', `/vendor-admin/ads/targeting/interest-suggestions?names=${encodeURIComponent(names.join('|'))}`);
export const searchAdLocations = (q: string): Promise<LocationOption[]> => req('GET', `/vendor-admin/ads/targeting/locations?q=${encodeURIComponent(q)}`);
export const estimateAdReach = (body: { objective: AdObjective; destination: AdDestination; targeting: AdTargeting }): Promise<{ estimate: { lower: number; upper: number } | null }> =>
  req('POST', '/vendor-admin/ads/targeting/reach', body);
export const quoteAd = (body: { dailyBudgetKobo: number; days: number; route: AdPaymentRoute }): Promise<AdQuote> => req('POST', '/vendor-admin/ads/quote', body);
export const draftAdCopy = (body: { objective: AdObjective; destination: AdDestination; brief: string | null }): Promise<AdCopyDraft> => req('POST', '/vendor-admin/ads/copy', body);
export const listAdCampaigns = (): Promise<{ campaigns: AdCampaign[]; creditKobo: number }> => req('GET', '/vendor-admin/ads/campaigns');
export const getAdCampaign = (id: string): Promise<AdCampaignDetail> => req('GET', `/vendor-admin/ads/campaigns/${id}`);
export const createAdCampaign = (body: NewAdCampaign): Promise<AdCampaign> => req('POST', '/vendor-admin/ads/campaigns', body);
export const checkoutAdCampaign = (id: string): Promise<AdCheckout> => req('POST', `/vendor-admin/ads/campaigns/${id}/checkout`, { from: 'mobile' });
export const extendAdCampaign = (id: string, days: number): Promise<AdCheckout> => req('POST', `/vendor-admin/ads/campaigns/${id}/extend`, { days, from: 'mobile' });
export const retryAdCampaign = (id: string): Promise<AdCampaign> => req('POST', `/vendor-admin/ads/campaigns/${id}/retry`, {});
export const cancelAdCampaign = (id: string): Promise<AdCampaign> => req('POST', `/vendor-admin/ads/campaigns/${id}/cancel`, {});

/** Publish now, or at `at` (ISO). */
export function publishPost(id: string, platforms: ('facebook' | 'instagram')[], at?: string): Promise<Publication[]> {
  return req('POST', `/vendor-admin/content/posts/${id}/publish`, at ? { platforms, at } : { platforms });
}

export function retryPublication(id: string): Promise<Publication[]> {
  return req('POST', `/vendor-admin/content/publications/${id}/retry`, {});
}

export function cancelPublication(id: string): Promise<void> {
  return req('POST', `/vendor-admin/content/publications/${id}/cancel`, {});
}

export type LeadSource = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'booking_page' | 'referral' | 'walk_in' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', whatsapp: 'WhatsApp',
  booking_page: 'Booking page', referral: 'Referral', walk_in: 'Walk-in', other: 'Other',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', won: 'Became a customer', lost: 'Not interested',
};

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  note: string | null;
  status: LeadStatus;
  followUpAt: string | null;
  createdAt: string;
  assignedStaff: { id: string; name: string | null } | null;
  customer: { id: string; name: string | null } | null;
  due: boolean;
}

export interface LeadFields {
  name?: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource;
  note?: string | null;
  status?: 'new' | 'contacted' | 'lost';
  assignedStaffId?: string | null;
  followUpAt?: string | null;
}

export function listLeads(params: { status?: LeadStatus; due?: boolean } = {}): Promise<Lead[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.due) qs.set('due', '1');
  const s = qs.toString();
  return req('GET', `/vendor-admin/leads${s ? `?${s}` : ''}`);
}

export function getLeadSummary(): Promise<{ open: number; due: number; won30d: number }> {
  return req('GET', '/vendor-admin/leads/summary');
}

export function getLead(id: string): Promise<Lead> {
  return req('GET', `/vendor-admin/leads/${id}`);
}

export function createLead(fields: LeadFields & { name: string; source: LeadSource }): Promise<Lead> {
  return req('POST', '/vendor-admin/leads', fields);
}

export function updateLead(id: string, fields: LeadFields): Promise<Lead> {
  return req('PATCH', `/vendor-admin/leads/${id}`, fields);
}

export function convertLead(id: string): Promise<Lead> {
  return req('POST', `/vendor-admin/leads/${id}/convert`, {});
}

export function deleteLead(id: string): Promise<void> {
  return req('DELETE', `/vendor-admin/leads/${id}`);
}

// ─── Insights: reports and feedback ──────────────────────────────────────────

export type ReportKind = 'sales' | 'bookings' | 'expenses' | 'cashflow' | 'customers' | 'retention';
export interface ReportGroup { key: string; label: string; count: number; amountKobo?: number }

export interface ReportsOverview {
  from: string;
  to: string;
  definitions: Record<string, string>;
  sales: { salesKobo: number; completed: number; averageSaleKobo: number | null; byService: ReportGroup[]; byStaff: ReportGroup[]; byDay: ReportGroup[] };
  bookings: { total: number; cancellationRate: number | null; noShowRate: number | null; byStatus: ReportGroup[]; byWeekday: ReportGroup[] };
  expenses: { totalKobo: number; byCategory: ReportGroup[] };
  cashflow: { inKobo: number; outKobo: number; netKobo: number; groups: ReportGroup[] };
  customers: { newCustomers: number; visited: number; bySource: ReportGroup[] };
  retention: { served: number; returning: number; firstVisits: number; returningRate: number | null; repeatRate: number | null; lapsed: number; groups: ReportGroup[] };
}

/** One record behind a report group. Fields depend on the record type. */
export interface ReportRecord {
  type: 'booking' | 'expense' | 'ledger' | 'customer';
  id: string;
  at: string | null;
  amountKobo?: number;
  customerName?: string | null;
  name?: string;
  phone?: string | null;
  staffName?: string | null;
  services?: string[];
  status?: string;
  label?: string;
  note?: string | null;
  direction?: 'in' | 'out';
  visits?: number;
}

export function getReports(from: string, to: string): Promise<ReportsOverview> {
  return req('GET', `/vendor-admin/reports?from=${from}&to=${to}`);
}

export function getReportRecords(kind: ReportKind, from: string, to: string, key?: string): Promise<ReportRecord[]> {
  const qs = new URLSearchParams({ from, to, ...(key ? { key } : {}) });
  return req('GET', `/vendor-admin/reports/${kind}/records?${qs}`);
}

export interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
  followedUpAt: string | null;
  needsFollowUp: boolean;
  bookingId: string;
  scheduledAt: string;
  customer: { id: string; name: string; phone: string | null };
  staffName: string | null;
}

export interface FeedbackOverview {
  from: string;
  to: string;
  average: number | null;
  count: number;
  asked: number;
  needsFollowUp: number;
  distribution: { stars: number; count: number }[];
  items: FeedbackItem[];
}

export function getFeedback(from: string, to: string): Promise<FeedbackOverview> {
  return req('GET', `/vendor-admin/feedback?from=${from}&to=${to}`);
}

export function markFeedbackFollowedUp(id: string): Promise<void> {
  return req('POST', `/vendor-admin/feedback/${id}/followed-up`, {});
}

/** The rating link for a completed booking, with a ready-made WhatsApp message. */
export function getFeedbackShare(bookingId: string): Promise<{ url: string; submitted: boolean; emailed: boolean; phone: string | null; message: string }> {
  return req('GET', `/vendor-admin/feedback/booking/${bookingId}`);
}

/** wa.me wants the number in international form without '+' — assume Nigeria for local 0-numbers. */
export function whatsappUrl(phone: string | null, text: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
