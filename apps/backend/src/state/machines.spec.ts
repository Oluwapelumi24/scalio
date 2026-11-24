import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AD_EXTENDABLE,
  AD_LIVE,
  BOOKING,
  BOOKING_HOLDS_SLOT,
  LISTING,
  adCanCancel,
  adCanCheckout,
  adCanExtend,
  adCanRetry,
  adCampaignStatusValues,
  bookingHoldsSlot,
  bookingIsCancelled,
  leadCanEdit,
  leadStatusValues,
  listingIsPublic,
  listingStatusValues,
  move,
  PAYROLL_RUN_OPEN,
  payoutStatusValues,
  payrollRunStatusValues,
  postCanPlan,
  postCanUnplan,
  postStatusValues,
  publicationCanRetry,
  publicationInFlight,
  publicationStatusValues,
  signupCodeResult,
  staffAccount,
} from '@veno/shared-types';
import { vendors } from '../db/schema';
import {
  ACTIVE_BOOKING_STATUSES,
  adCampaignStatusValues as storedAdStatuses,
  bookingStatusValues,
  contentPostStatusValues,
  leadStatusValues as storedLeadStatuses,
  publicationStatusValues as storedPublicationStatuses,
  salaryPayoutStatusValues,
  salaryRunStatusValues,
} from '../db/schema';

describe('shared state machines', () => {
  it('approves a waiting or sent-back listing, and only a sent-back listing returns to the queue', () => {
    expect(move(LISTING, 'pending_review', 'APPROVE')).toBe('approved');
    expect(move(LISTING, 'rejected', 'APPROVE')).toBe('approved');
    expect(move(LISTING, 'approved', 'APPROVE')).toBeNull();
    expect(move(LISTING, 'rejected', 'OWNER_REVISED')).toBe('pending_review');
    expect(move(LISTING, 'approved', 'OWNER_REVISED')).toBeNull();
    expect(move(LISTING, 'pending_review', 'REJECT')).toBe('rejected');
    expect(move(LISTING, 'approved', 'REJECT')).toBe('rejected');
    expect(listingIsPublic('approved')).toBe(true);
    expect(listingIsPublic('pending_review')).toBe(false);
    expect(listingIsPublic(null)).toBe(false);
  });

  it('keeps a confirmed booking from being paid again, and a finished booking from moving', () => {
    expect(move(BOOKING, 'pending_payment', 'PAYMENT_SUCCEEDED')).toBe('confirmed');
    expect(move(BOOKING, 'confirmed', 'PAYMENT_SUCCEEDED')).toBeNull();
    expect(move(BOOKING, 'completed', 'CUSTOMER_CANCELLED')).toBeNull();
    expect(move(BOOKING, 'confirmed', 'MARKED_NO_SHOW')).toBe('no_show');
  });

  it('derives a staff login from the email and whether they have set a password', () => {
    expect(staffAccount({ email: null })).toBe('no_portal');
    expect(staffAccount({ email: 'a@b.co', hasActivatedAccount: false })).toBe('invite_pending');
    expect(staffAccount({ email: 'a@b.co', passwordHash: 'hash' })).toBe('active');
  });

  it('names the signup code results Redis returns', () => {
    expect(signupCodeResult(1)).toBe('proved');
    expect(signupCodeResult(-1)).toBe('expired');
    expect(signupCodeResult(0)).toBe('wrong');
  });

  it('locks the ad, lead, and post gates the services already enforce', () => {
    expect(adCanCheckout('awaiting_payment')).toBe(true);
    expect(adCanCheckout('active')).toBe(false);
    expect(adCanExtend('completed')).toBe(true);
    expect(adCanExtend('failed')).toBe(false);
    expect(AD_EXTENDABLE).toEqual([...AD_LIVE, 'completed']);
    expect(adCanRetry('failed')).toBe(true);
    expect(adCanCancel('launching')).toBe(false);
    expect(leadCanEdit('won')).toBe(false);
    expect(leadCanEdit('lost')).toBe(true);
    expect(postCanPlan('posted')).toBe(false);
    expect(postCanPlan('draft')).toBe(true);
    expect(publicationInFlight('published')).toBe('published');
    expect(publicationInFlight('queued')).toBeNull();
    expect(publicationCanRetry('failed')).toBe(true);
    expect(publicationCanRetry('publishing')).toBe(false);
    expect(postCanUnplan('planned')).toBe(true);
    expect(postCanUnplan('draft')).toBe(false);
    expect(bookingHoldsSlot('confirmed')).toBe(true);
    expect(bookingHoldsSlot('completed')).toBe(false);
    expect(bookingIsCancelled('cancelled_by_customer')).toBe(true);
    expect(bookingIsCancelled('cancelled')).toBe(false);
  });

  it('matches the status lists stored in Postgres', () => {
    const same = (stored: readonly string[], catalog: readonly string[]) => {
      expect([...stored].sort()).toEqual([...catalog].sort());
    };
    same(bookingStatusValues, Object.keys(BOOKING));
    same(ACTIVE_BOOKING_STATUSES, BOOKING_HOLDS_SLOT);
    same(contentPostStatusValues, postStatusValues);
    same(storedLeadStatuses, leadStatusValues);
    same(storedPublicationStatuses, publicationStatusValues);
    same(storedAdStatuses, adCampaignStatusValues);
    same(salaryPayoutStatusValues, payoutStatusValues);
    same(salaryRunStatusValues, payrollRunStatusValues);
    expect(PAYROLL_RUN_OPEN).toBe('open');
    same(vendors.approvalStatus.enumValues, listingStatusValues);
    const index = readFileSync(join(__dirname, '../db/schema/bookings.ts'), 'utf8');
    expect(index).toContain(`in ('${BOOKING_HOLDS_SLOT.join("', '")}')`);
  });
});
