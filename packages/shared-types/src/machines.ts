import type { BookingStatus } from './booking';

/**
 * The legal steps of each flow, in one place.
 *
 * Stored values do not change. `move` returns the next state, or null when
 * that step is not allowed. Call sites keep their own sentences for a refusal.
 * A null column is not a state: derive it with the function named here.
 */

export function move<S extends string, E extends string>(
  table: Record<S, Partial<Record<E, S>>>,
  from: S,
  event: E,
): S | null {
  return table[from][event] ?? null;
}

// --- Booking (customer pays or cancels; vendor completes, cancels, or marks a no-show) ---

export type BookingEvent =
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED_OR_TIMED_OUT'
  | 'CUSTOMER_CANCELLED'
  | 'VENDOR_CANCELLED'
  | 'MARKED_COMPLETED'
  | 'MARKED_NO_SHOW';

export const BOOKING: Record<BookingStatus, Partial<Record<BookingEvent, BookingStatus>>> = {
  pending_payment: {
    PAYMENT_SUCCEEDED: 'confirmed',
    PAYMENT_FAILED_OR_TIMED_OUT: 'cancelled_by_customer',
    CUSTOMER_CANCELLED: 'cancelled_by_customer',
    VENDOR_CANCELLED: 'cancelled_by_vendor',
  },
  confirmed: {
    CUSTOMER_CANCELLED: 'cancelled_by_customer',
    VENDOR_CANCELLED: 'cancelled_by_vendor',
    MARKED_COMPLETED: 'completed',
    MARKED_NO_SHOW: 'no_show',
  },
  completed: {},
  cancelled_by_customer: {},
  cancelled_by_vendor: {},
  no_show: {},
};

/** Statuses that still hold the slot. Matches the partial unique index on bookings. */
export const BOOKING_HOLDS_SLOT: readonly BookingStatus[] = ['pending_payment', 'confirmed'];

export const BOOKING_CANCELLED: readonly BookingStatus[] = ['cancelled_by_customer', 'cancelled_by_vendor'];

export function bookingHoldsSlot(status: string | null | undefined): boolean {
  return status != null && (BOOKING_HOLDS_SLOT as readonly string[]).includes(status);
}

export function bookingIsCancelled(status: string | null | undefined): boolean {
  return status != null && (BOOKING_CANCELLED as readonly string[]).includes(status);
}

// --- Listing (super admin reviews; the owner can send a rejected page back; customers only see approved) ---

export const listingStatusValues = ['pending_review', 'approved', 'rejected'] as const;
export type ListingStatus = (typeof listingStatusValues)[number];
export type ListingEvent = 'APPROVE' | 'REJECT' | 'OWNER_REVISED';

export const LISTING: Record<ListingStatus, Partial<Record<ListingEvent, ListingStatus>>> = {
  pending_review: { APPROVE: 'approved', REJECT: 'rejected' },
  approved: { REJECT: 'rejected' },
  rejected: { APPROVE: 'approved', OWNER_REVISED: 'pending_review' },
};

/** Short badge words. Vendor dashboard banners keep their own sentences. */
export const LISTING_LABEL: Record<'super_admin' | 'vendor', Record<ListingStatus, string>> = {
  super_admin: { pending_review: 'Pending', approved: 'Approved', rejected: 'Rejected' },
  vendor: {
    pending_review: 'Waiting for review',
    approved: 'Live',
    rejected: 'Sent back',
  },
};

/** The only listing status a customer can open. */
export const LISTING_PUBLIC: ListingStatus = 'approved';

export function listingIsPublic(status: string | null | undefined): boolean {
  return status === LISTING_PUBLIC;
}

// --- Staff login (derived: there is no status column) ---

export type StaffAccount = 'no_portal' | 'invite_pending' | 'active';

export function staffAccount(member: { email: string | null; hasActivatedAccount?: boolean; passwordHash?: string | null }): StaffAccount {
  if (!member.email) return 'no_portal';
  if (member.hasActivatedAccount || member.passwordHash) return 'active';
  return 'invite_pending';
}

export const STAFF_ACCOUNT_LABEL: Record<StaffAccount, string> = {
  no_portal: 'No portal access',
  invite_pending: 'Invite pending',
  active: 'Active',
};

// --- Signup code (Redis, not a row). -1 missing, 0 wrong, 1 matched. ---

export type SignupCodeResult = 'expired' | 'wrong' | 'proved';

export function signupCodeResult(redisResult: number): SignupCodeResult {
  if (redisResult === 1) return 'proved';
  if (redisResult === -1) return 'expired';
  return 'wrong';
}

// --- Leads. A won lead is a customer and is no longer edited. Any other status may be set. ---

export const leadStatusValues = ['new', 'contacted', 'won', 'lost'] as const;
export type LeadStatus = (typeof leadStatusValues)[number];

export function leadCanEdit(status: LeadStatus): boolean {
  return status !== 'won';
}

// --- A post the vendor writes. Posted posts stay in history. ---

export const postStatusValues = ['draft', 'planned', 'posted'] as const;
export type PostStatus = (typeof postStatusValues)[number];

export function postCanPlan(status: PostStatus): boolean {
  return status !== 'posted';
}

export function postCanUnplan(status: PostStatus): boolean {
  return status === 'planned';
}

// --- A post Veno publishes. Only a queued one can be cancelled. The worker moves the rest. ---

export const publicationStatusValues = ['queued', 'publishing', 'published', 'failed', 'cancelled'] as const;
export type PublicationStatus = (typeof publicationStatusValues)[number];

export const PUBLICATION_QUEUED: PublicationStatus = 'queued';

/** Queued or mid-send. A post is not "posted" while any platform is still in this set. */
export const PUBLICATION_STILL_GOING: readonly PublicationStatus[] = ['queued', 'publishing'];

export function publicationCanCancel(status: PublicationStatus): boolean {
  return status === PUBLICATION_QUEUED;
}

/** Already out, or mid-flight. A new publish must not start over either. */
export function publicationInFlight(status: PublicationStatus): 'published' | 'publishing' | null {
  if (status === 'published' || status === 'publishing') return status;
  return null;
}

export function publicationCanRetry(status: PublicationStatus): boolean {
  return status === 'failed' || status === 'cancelled';
}

// --- Ads the vendor pays for. Meta's review maps onto the live states separately (statusFromMeta). ---

export const adCampaignStatusValues = [
  'awaiting_payment',
  'launching',
  'in_review',
  'active',
  'paused',
  'completed',
  'rejected',
  'failed',
  'cancelled',
] as const;
export type AdCampaignStatus = (typeof adCampaignStatusValues)[number];

export const AD_LIVE: readonly AdCampaignStatus[] = ['in_review', 'active', 'paused'];
export const AD_EXTENDABLE: readonly AdCampaignStatus[] = ['in_review', 'active', 'paused', 'completed'];

export function adCanCheckout(status: AdCampaignStatus): boolean {
  return status === 'awaiting_payment';
}

export function adCanExtend(status: AdCampaignStatus): boolean {
  return (AD_EXTENDABLE as readonly string[]).includes(status);
}

export function adCanRetry(status: AdCampaignStatus): boolean {
  return status === 'failed';
}

export function adIsLaunching(status: AdCampaignStatus): boolean {
  return status === 'launching' || status === 'failed';
}

export function adCanCancel(status: AdCampaignStatus): boolean {
  return status === 'awaiting_payment' || status === 'failed';
}

// --- Payroll. A payout leaves pending once. The run completes when none are pending. ---

export const payoutStatusValues = ['pending', 'paid', 'skipped'] as const;
export type PayoutStatus = (typeof payoutStatusValues)[number];

export const PAYOUT_OPEN: PayoutStatus = 'pending';

export const payrollRunStatusValues = ['open', 'completed'] as const;
export type PayrollRunStatus = (typeof payrollRunStatusValues)[number];

/** A run leaves open once, when every payout has been paid or skipped. */
export const PAYROLL_RUN_OPEN: PayrollRunStatus = 'open';

export function payoutCanSettle(status: PayoutStatus): boolean {
  return status === PAYOUT_OPEN;
}

// Two more machines already have their own files. Do not copy them here.
// Inbox replies: apps/backend/src/inbox/handoff.ts decideReply.
// Meta's ad review words onto in_review | active | paused | completed | rejected:
// apps/backend/src/ads/campaign-rules.ts statusFromMeta.
