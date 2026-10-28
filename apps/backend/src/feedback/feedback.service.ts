import { BadRequestException, GoneException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, gte, inArray, isNotNull, isNull, lte, sql, type SQL } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { DB, type Database } from '../db/db.module';
import { bookings, customers, feedbackRequests, services, staff, vendors } from '../db/schema';
import { MailService } from '../mail/mail.service';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';

const LINK_DAYS = 30;
/** Ratings at or below this need someone at the business to follow up. */
export const LOW_RATING = 2;

/** A rating summary: average to one decimal, count, and how many of each star. */
export function summariseRatings(ratings: number[]) {
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: ratings.filter((r) => r === stars).length }));
  const average = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;
  return { average, count: ratings.length, distribution };
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  linkFor(token: string): string {
    const configured = this.config.get<string>('PUBLIC_FEEDBACK_URL');
    const base = configured ?? (this.config.get<string>('PUBLIC_BOOKING_URL') ?? 'http://localhost:3003/book').replace(/\/book\/?$/, '/feedback');
    return `${base.replace(/\/$/, '')}/${token}`;
  }

  /**
   * Called when a booking is completed: makes its feedback link (once) and
   * emails it if the customer has an email. Never throws — feedback must not
   * get in the way of completing a booking.
   */
  async requestForBooking(bookingId: string, now = new Date()): Promise<void> {
    try {
      const [b] = await this.db
        .select({ id: bookings.id, vendorId: bookings.vendorId, customerId: bookings.customerId, staffId: bookings.staffId, status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId));
      if (!b || b.status !== 'completed') return;
      const [created] = await this.db
        .insert(feedbackRequests)
        .values({
          vendorId: b.vendorId, bookingId: b.id, customerId: b.customerId, staffId: b.staffId,
          token: randomBytes(18).toString('base64url'), expiresAt: new Date(now.getTime() + LINK_DAYS * 86_400_000),
        })
        .onConflictDoNothing({ target: feedbackRequests.bookingId })
        .returning();
      if (!created) return;

      const [who] = await this.db
        .select({ email: customers.email, name: customers.name, business: vendors.businessName })
        .from(customers)
        .innerJoin(vendors, eq(vendors.id, customers.vendorId))
        .where(eq(customers.id, b.customerId));
      if (!who?.email) return; // the business can still send the link on WhatsApp
      await this.mail.sendFeedbackRequestEmail(who.email, who.name.split(' ')[0], who.business, this.linkFor(created.token));
      await this.db.update(feedbackRequests).set({ emailedAt: new Date() }).where(eq(feedbackRequests.id, created.id));
    } catch (err) {
      this.logger.warn(`Feedback request for booking ${bookingId} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Public: the customer's rating page ─────────────────────────────────────

  private async byToken(token: string) {
    const [row] = await this.db
      .select({ req: feedbackRequests, businessName: vendors.businessName, logoUrl: vendors.logoUrl, themeColor: vendors.themeColor, staffName: staff.name, scheduledAt: bookings.scheduledAt, serviceIds: bookings.serviceIds, customerName: customers.name })
      .from(feedbackRequests)
      .innerJoin(vendors, eq(vendors.id, feedbackRequests.vendorId))
      .innerJoin(bookings, eq(bookings.id, feedbackRequests.bookingId))
      .innerJoin(customers, eq(customers.id, feedbackRequests.customerId))
      .leftJoin(staff, eq(staff.id, feedbackRequests.staffId))
      .where(eq(feedbackRequests.token, token));
    if (!row) throw new NotFoundException('This feedback link is not valid.');
    return row;
  }

  async publicView(token: string, now = new Date()) {
    const r = await this.byToken(token);
    const serviceRows = r.serviceIds.length
      ? await this.db.select({ name: services.name }).from(services).where(inArray(services.id, r.serviceIds))
      : [];
    return {
      businessName: r.businessName,
      logoUrl: r.logoUrl,
      themeColor: r.themeColor,
      customerFirstName: r.customerName.split(' ')[0],
      staffFirstName: r.staffName?.split(' ')[0] ?? null,
      services: serviceRows.map((s) => s.name),
      visitedAt: r.scheduledAt.toISOString(),
      submitted: r.req.submittedAt ? { rating: r.req.rating, comment: r.req.comment } : null,
      expired: !r.req.submittedAt && r.req.expiresAt < now,
    };
  }

  /** One response per visit. */
  async submit(token: string, rating: number, comment: string | undefined, now = new Date()) {
    const r = await this.byToken(token);
    if (r.req.submittedAt) throw new BadRequestException('Thanks — you already rated this visit.');
    if (r.req.expiresAt < now) throw new GoneException('This feedback link has expired.');
    const [saved] = await this.db
      .update(feedbackRequests)
      .set({ rating, comment: comment?.trim() || null, submittedAt: now })
      .where(and(eq(feedbackRequests.id, r.req.id), isNull(feedbackRequests.submittedAt)))
      .returning({ id: feedbackRequests.id });
    if (!saved) throw new BadRequestException('Thanks — you already rated this visit.');
    // Private to the business for now: the public star rating (vendors.rating) is
    // left alone until it's decided how these combine with existing ratings.
    return { ok: true };
  }

  // ── Business side ──────────────────────────────────────────────────────────

  private scope(me: VendorPrincipal): SQL[] {
    const where: SQL[] = [eq(feedbackRequests.vendorId, me.vendorId)];
    if (me.role === 'practitioner') where.push(eq(feedbackRequests.staffId, me.staffId));
    return where;
  }

  /** Ratings in [start, end] (by when they were given), with the summary. Practitioners see their own. */
  async list(me: VendorPrincipal, start: Date, end: Date) {
    const where = [...this.scope(me), isNotNull(feedbackRequests.submittedAt), gte(feedbackRequests.submittedAt, start), lte(feedbackRequests.submittedAt, end)];
    const rows = await this.db
      .select({
        id: feedbackRequests.id, rating: feedbackRequests.rating, comment: feedbackRequests.comment, submittedAt: feedbackRequests.submittedAt,
        followedUpAt: feedbackRequests.followedUpAt, bookingId: feedbackRequests.bookingId, scheduledAt: bookings.scheduledAt,
        customer: { id: customers.id, name: customers.name, phone: customers.phone }, staffName: staff.name,
      })
      .from(feedbackRequests)
      .innerJoin(bookings, eq(bookings.id, feedbackRequests.bookingId))
      .innerJoin(customers, eq(customers.id, feedbackRequests.customerId))
      .leftJoin(staff, eq(staff.id, feedbackRequests.staffId))
      .where(and(...where))
      .orderBy(desc(feedbackRequests.submittedAt))
      .limit(300);

    const [asked] = await this.db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(feedbackRequests)
      .where(and(...this.scope(me), gte(feedbackRequests.createdAt, start), lte(feedbackRequests.createdAt, end)));
    const summary = summariseRatings(rows.map((r) => r.rating!));
    return {
      ...summary,
      asked: asked?.n ?? 0,
      needsFollowUp: rows.filter((r) => r.rating! <= LOW_RATING && !r.followedUpAt).length,
      items: rows.map((r) => ({ ...r, needsFollowUp: r.rating! <= LOW_RATING && !r.followedUpAt })),
    };
  }

  async markFollowedUp(me: VendorPrincipal, id: string) {
    const [row] = await this.db
      .update(feedbackRequests)
      .set({ followedUpAt: new Date(), followedUpById: me.staffId })
      .where(and(eq(feedbackRequests.id, id), ...this.scope(me), isNotNull(feedbackRequests.submittedAt)))
      .returning({ id: feedbackRequests.id });
    if (!row) throw new NotFoundException('Feedback not found');
  }

  /**
   * The link for one completed booking, plus a ready-made WhatsApp message —
   * for customers without an email, or to remind them. Creates it if the
   * booking was completed before feedback existed.
   */
  async shareForBooking(me: VendorPrincipal, bookingId: string) {
    const [b] = await this.db
      .select({ id: bookings.id, status: bookings.status, staffId: bookings.staffId, customerName: customers.name, phone: customers.phone, business: vendors.businessName })
      .from(bookings)
      .innerJoin(customers, eq(customers.id, bookings.customerId))
      .innerJoin(vendors, eq(vendors.id, bookings.vendorId))
      .where(and(eq(bookings.id, bookingId), eq(bookings.vendorId, me.vendorId)));
    if (!b || (me.role === 'practitioner' && b.staffId !== me.staffId)) throw new NotFoundException('Booking not found');
    if (b.status !== 'completed') throw new BadRequestException('You can ask for feedback once the booking is completed.');
    await this.requestForBooking(b.id);
    const [req] = await this.db.select().from(feedbackRequests).where(eq(feedbackRequests.bookingId, b.id));
    if (!req) throw new BadRequestException("Couldn't create the feedback link. Please try again.");
    const url = this.linkFor(req.token);
    return {
      url,
      submitted: !!req.submittedAt,
      emailed: !!req.emailedAt,
      phone: b.phone,
      message: `Hi ${b.customerName.split(' ')[0]}, thanks for visiting ${b.business}! How did we do? It takes 10 seconds: ${url}`,
    };
  }
}
