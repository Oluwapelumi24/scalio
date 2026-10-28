import { BadGatewayException, BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { decryptPii } from '../common/crypto';
import { DB, type Database } from '../db/db.module';
import {
  adAccounts, adCampaigns, adCreditEntries, adPayments, contentMedia, metaUserAccess, scalioPageAccess, socialConnections, staff, vendors,
  type AdCampaignStatus, type AdLocation, type AdPaymentRoute,
} from '../db/schema';
import { PaystackService } from '../payments/paystack.service';
import { HomeDataService } from '../personalisation/home-data.service';
import { MetaConfig } from '../social/meta-config';
import { MetaApiError } from '../social/meta-graph';
import { AdsConfig } from './ads-config';
import {
  DEFAULT_DAILY_BUDGET_KOBO, OBJECTIVES, adSetParams, campaignParams, creativeParams, defaultSchedule, extendEnd, optimizationGoal, quote,
  runDays, statusFromMeta, toMetaTargeting, unspentCreditKobo, validateDraft, type CampaignDraft, type MetaIds, type Quote,
} from './campaign-rules';
import { MetaAdsApi, type InterestOption, type LocationOption } from './meta-ads-api';

type Campaign = typeof adCampaigns.$inferSelect;
export type CheckoutFrom = 'web' | 'mobile';

const LIVE_STATUSES: AdCampaignStatus[] = ['in_review', 'active', 'paused'];

/** Campaigns: draft → pay → launch on Meta → follow Meta's review and spend (ADS_MANAGER_PLAN.md §2b–§4). */
@Injectable()
export class AdCampaignsService {
  private readonly logger = new Logger(AdCampaignsService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly meta: MetaConfig,
    private readonly ads: AdsConfig,
    private readonly paystack: PaystackService,
    private readonly homeData: HomeDataService,
    private readonly config: ConfigService,
  ) {}

  private get api(): MetaAdsApi {
    if (!this.meta.adsEnabled || !this.meta.graph) throw new ServiceUnavailableException('Ads aren’t switched on in Scalio yet.');
    return new MetaAdsApi(this.meta.graph);
  }

  // ── What the builder needs ────────────────────────────────────────────────

  private async connections(vendorId: string) {
    const [rows, [access], [own]] = await Promise.all([
      this.db.select().from(socialConnections).where(eq(socialConnections.vendorId, vendorId)),
      this.db.select().from(metaUserAccess).where(eq(metaUserAccess.vendorId, vendorId)),
      this.db.select().from(adAccounts).where(eq(adAccounts.vendorId, vendorId)),
    ]);
    const page = rows.find((r) => r.platform === 'facebook' && r.status === 'active') ?? null;
    const instagram = rows.find((r) => r.platform === 'instagram' && r.status === 'active') ?? null;
    const userToken = access && access.grantedScopes.includes('ads_management') && (!access.expiresAt || access.expiresAt > new Date())
      ? decryptPii(access.tokenEnc) : null;
    return { page, instagram, userToken, own: own ?? null };
  }

  /** A token that can call the targeting search: the vendor's, else Scalio's. */
  private async searchToken(vendorId: string): Promise<string> {
    const { userToken } = await this.connections(vendorId);
    const token = userToken ?? this.ads.scalioToken;
    if (!token) throw new BadRequestException('Connect Facebook and allow Scalio to manage ads first.');
    return token;
  }

  /** Which ways to pay are open to this business right now, and why not when they aren't. */
  async routes(vendorId: string) {
    const { page, userToken, own } = await this.connections(vendorId);
    const scalioReason = this.ads.scalioRouteUnavailable ?? (page ? null : 'Connect your Facebook Page first.');
    let ownReason: string | null = null;
    if (!userToken) ownReason = 'Reconnect Facebook and allow Scalio to manage ads.';
    else if (!own || own.ownedBy !== 'vendor') ownReason = 'Choose your Meta ad account in Ads setup.';
    else if (own.metaStatus !== 1 || own.status !== 'active') ownReason = 'Your Meta ad account can’t run ads right now — see Ads setup.';
    else if (own.currency !== 'NGN') ownReason = `Your Meta ad account is in ${own.currency}; Scalio supports naira ad accounts for now.`;
    else if (!own.hasPaymentMethod) ownReason = 'Add a card to your Meta ad account first (Ads setup → Card on Meta).';
    return {
      scalio: { available: scalioReason === null, reason: scalioReason },
      own_meta: { available: ownReason === null, reason: ownReason, adAccountName: own?.name ?? null, paymentMethodLabel: own?.paymentMethodLabel ?? null },
    };
  }

  async creditBalance(vendorId: string): Promise<number> {
    const [r] = await this.db.select({ total: sql<string>`coalesce(sum(${adCreditEntries.amountKobo}), 0)` }).from(adCreditEntries).where(eq(adCreditEntries.vendorId, vendorId));
    return Number(r?.total ?? 0);
  }

  /** Everything the builder pre-fills in simple mode, plus the options advanced mode offers. */
  async defaults(vendorId: string) {
    const [vendor] = await this.db.select({ businessName: vendors.businessName, category: vendors.category, address: vendors.address, slug: vendors.slug })
      .from(vendors).where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    const { page, instagram, userToken } = await this.connections(vendorId);
    const token = userToken ?? this.ads.scalioToken ?? null;
    const now = new Date();

    // Best-effort guesses from Meta; the vendor can change both.
    let location: AdLocation | null = null;
    let interests: { id: string; name: string }[] = [];
    if (token && this.meta.adsEnabled && this.meta.graph) {
      const api = new MetaAdsApi(this.meta.graph);
      const city = guessCity(vendor.address);
      const [locs, ints] = await Promise.all([
        api.searchLocations(token, city).catch((): LocationOption[] => []),
        api.searchInterests(token, vendor.category).catch((): InterestOption[] => []),
      ]);
      const loc = locs.find((l) => l.type === 'city') ?? locs[0];
      if (loc) location = { key: loc.key, type: loc.type, name: loc.label, ...(loc.type === 'city' ? { radiusKm: 10 } : {}) };
      interests = ints.slice(0, 3).map((i) => ({ id: i.id, name: i.name }));
    }
    const schedule = defaultSchedule(now);
    return {
      name: `${vendor.businessName} – ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      objective: 'engagement' as const,
      destination: instagram && !page ? 'instagram_direct' as const : 'whatsapp' as const,
      // If Meta couldn't place the business, start nationwide; the vendor narrows it on the Audience step.
      targeting: { locations: [location ?? { key: 'NG', type: 'country' as const, name: 'Nigeria' }], ageMin: 18, ageMax: 45, genders: 'all' as const, interests, placements: 'automatic' as const },
      dailyBudgetKobo: DEFAULT_DAILY_BUDGET_KOBO,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      days: schedule.days,
      bookingLink: this.homeData.bookingLinkFor(vendor.slug),
      pageName: page?.displayName ?? null,
      instagramName: instagram?.displayName ?? null,
      objectives: Object.values(OBJECTIVES).map(({ id, label, blurb, bestFor, destinations, simple }) => ({ id, label, blurb, bestFor, destinations, simple })),
      fee: this.ads.fee,
      creditKobo: await this.creditBalance(vendorId),
      routes: await this.routes(vendorId),
    };
  }

  async searchInterests(vendorId: string, q: string) {
    return this.wrap(() => this.searchToken(vendorId).then((t) => this.api.searchInterests(t, q)));
  }

  async suggestInterests(vendorId: string, names: string[]) {
    return this.wrap(() => this.searchToken(vendorId).then((t) => this.api.suggestInterests(t, names)));
  }

  async searchLocations(vendorId: string, q: string) {
    return this.wrap(() => this.searchToken(vendorId).then((t) => this.api.searchLocations(t, q)));
  }

  /** Audience-size meter. Null when Meta can't estimate (e.g. no ad account to ask). */
  async reach(vendorId: string, d: Pick<CampaignDraft, 'objective' | 'destination' | 'targeting'>) {
    const { userToken, own } = await this.connections(vendorId);
    const target = own?.ownedBy === 'vendor' && userToken
      ? { account: own.metaAdAccountId, token: userToken }
      : this.ads.scalioRouteUnavailable === null ? { account: this.ads.scalioAccountFor(vendorId), token: this.ads.scalioToken! } : null;
    if (!target || d.targeting.locations.length === 0) return null;
    try {
      return await this.api.reachEstimate(target.account, target.token, toMetaTargeting(d.targeting), optimizationGoal(d.objective, d.destination));
    } catch (err) {
      this.logger.debug(`Reach estimate failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async quote(vendorId: string, dailyBudgetKobo: number, days: number, route: AdPaymentRoute): Promise<Quote> {
    return quote({ dailyBudgetKobo, days, route, fee: this.ads.fee, creditKobo: route === 'scalio' ? await this.creditBalance(vendorId) : 0 });
  }

  // ── Create, pay, launch ───────────────────────────────────────────────────

  async create(vendorId: string, staffId: string, d: CampaignDraft) {
    const problems = validateDraft(d, new Date());
    if (problems.length) throw new BadRequestException(problems.join(' '));
    const [media] = await this.db.select({ id: contentMedia.id }).from(contentMedia)
      .where(and(eq(contentMedia.id, d.creative.mediaId), eq(contentMedia.vendorId, vendorId)));
    if (!media) throw new BadRequestException('Upload the photo for your ad again.');
    const routes = await this.routes(vendorId);
    const r = routes[d.route];
    if (!r.available) throw new BadRequestException(r.reason ?? 'That way of paying isn’t available.');

    const [row] = await this.db.insert(adCampaigns).values({
      vendorId, name: d.name.trim().slice(0, 120), mode: d.mode, objective: d.objective, destination: d.destination, route: d.route,
      dailyBudgetKobo: d.dailyBudgetKobo, startAt: d.startAt, endAt: d.endAt, targeting: d.targeting, creative: d.creative,
      extras: d.extras, mediaId: media.id, createdById: staffId,
    }).returning();
    return this.view(row);
  }

  /** Starts payment for launching (or extending) a campaign. Returns where to pay, or launches straight away when credit covers it. */
  async checkout(vendorId: string, staffId: string, campaignId: string, from: CheckoutFrom, extendDays?: number) {
    const c = await this.find(vendorId, campaignId);
    const extend = extendDays !== undefined;
    if (!extend && c.status !== 'awaiting_payment') throw new ConflictException('This ad is already paid for.');
    if (extend && ![...LIVE_STATUSES, 'completed'].includes(c.status)) throw new ConflictException('Only ads that have launched can be extended.');
    if (c.route === 'scalio' && !extend) await this.ensurePageAccess(vendorId);

    const days = extend ? extendDays : runDays(c.startAt, c.endAt);
    const q = await this.quote(vendorId, c.dailyBudgetKobo, days, c.route);
    const paymentId = randomUUID();
    const reference = `ads_${paymentId}`;
    await this.db.insert(adPayments).values({
      id: paymentId, vendorId, campaignId, purpose: extend ? 'extend' : 'launch', extraDays: extend ? days : null, route: c.route,
      spendKobo: c.route === 'scalio' ? q.spendKobo : 0, vatKobo: c.route === 'scalio' ? q.vatKobo : 0, feeKobo: q.feeKobo,
      creditUsedKobo: q.creditUsedKobo, amountDueKobo: q.dueNowKobo, reference, createdById: staffId,
    });

    if (q.dueNowKobo === 0) {
      await this.markPaid(reference, 0);
      return { paid: true as const, authorizationUrl: null, quote: q, campaign: this.view(await this.find(vendorId, campaignId)) };
    }
    const email = await this.payerEmail(vendorId, staffId);
    const web = (this.config.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
    const init = await this.paystack.initializeTransaction({
      email, amountKobo: q.dueNowKobo, reference,
      // The app refreshes when the person comes back; the website returns to the ad.
      callbackUrl: from === 'web' ? `${web}/dashboard/ads/campaigns/${campaignId}?paid=1` : undefined,
    }).catch((err: unknown) => {
      this.logger.error(`Paystack initialize failed for ${reference}: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadGatewayException('We couldn’t start the payment with Paystack. Please try again in a minute.');
    });
    return { paid: false as const, authorizationUrl: init.authorizationUrl, quote: q, campaign: this.view(c) };
  }

  /** Paystack's charge.success for an `ads_` reference. Safe to call again for the same reference. */
  async markPaid(reference: string, amountKobo: number) {
    const [p] = await this.db.select().from(adPayments).where(eq(adPayments.reference, reference));
    if (!p) throw new NotFoundException(`No ad payment ${reference}`);
    if (p.status === 'paid') return;
    if (amountKobo < p.amountDueKobo) throw new BadRequestException(`Ad payment ${reference} was short: ${amountKobo} < ${p.amountDueKobo}`);

    const claimed = await this.db.update(adPayments).set({ status: 'paid', paidAt: new Date() })
      .where(and(eq(adPayments.id, p.id), eq(adPayments.status, 'pending'))).returning({ id: adPayments.id });
    if (claimed.length === 0) return; // another delivery got here first
    if (p.creditUsedKobo > 0) {
      await this.db.insert(adCreditEntries).values({
        vendorId: p.vendorId, campaignId: p.campaignId, amountKobo: -p.creditUsedKobo, reason: 'used_for_payment', dedupeKey: `use:${p.id}`,
      }).onConflictDoNothing();
    }

    if (p.purpose === 'launch') {
      await this.db.update(adCampaigns).set({ status: 'launching', paidSpendKobo: p.route === 'scalio' ? p.spendKobo : 0, updatedAt: new Date() })
        .where(eq(adCampaigns.id, p.campaignId));
      await this.launch(p.campaignId).catch(() => undefined); // failures are recorded on the campaign
    } else {
      await this.applyExtension(p.campaignId, p.extraDays ?? 0, p.route === 'scalio' ? p.spendKobo : 0);
    }
  }

  async markFailed(reference: string) {
    await this.db.update(adPayments).set({ status: 'failed' }).where(and(eq(adPayments.reference, reference), eq(adPayments.status, 'pending')));
  }

  /**
   * Creates the campaign on Meta. Each step stores its id, so a retry carries
   * on where it stopped instead of creating duplicates. Everything is created
   * paused and the campaign is switched on last.
   */
  async launch(campaignId: string) {
    let [c] = await this.db.select().from(adCampaigns).where(eq(adCampaigns.id, campaignId));
    if (!c || !['launching', 'failed'].includes(c.status)) return;
    try {
      const run = await this.runner(c);
      const save = async (fields: Partial<Campaign>) => {
        [c] = await this.db.update(adCampaigns).set({ ...fields, updatedAt: new Date() }).where(eq(adCampaigns.id, campaignId)).returning();
      };
      if (!c.metaAdAccountId) await save({ metaAdAccountId: run.account });
      const currency = await this.api.adAccountCurrency(run.account, run.token);
      if (currency !== 'NGN') throw new Error(`The ad account is in ${currency}; Scalio runs naira ad accounts only.`);

      const budget = c.route === 'scalio' ? c.paidSpendKobo : c.dailyBudgetKobo * runDays(c.startAt, c.endAt);
      // An ad scheduled to start "now" may be a few minutes in the past by launch time.
      const startAt = c.startAt.getTime() < Date.now() ? new Date(Date.now() + 60_000) : c.startAt;
      if (!c.metaCampaignId) {
        await save({ metaCampaignId: await this.api.create(run.account, run.token, 'campaigns', campaignParams(c, c.route === 'scalio' ? c.paidSpendKobo : null)) });
      }
      if (!c.metaAdSetId) {
        await save({ metaAdSetId: await this.api.create(run.account, run.token, 'adsets', adSetParams({ ...c, startAt }, run.ids, c.metaCampaignId!, budget)) });
      }
      if (!c.metaCreativeId) {
        const [media] = c.mediaId ? await this.db.select().from(contentMedia).where(eq(contentMedia.id, c.mediaId)) : [];
        if (!media) throw new Error('The ad’s photo is missing — create the ad again with a photo.');
        const hash = await this.api.uploadImage(run.account, run.token, media.dataBase64);
        await save({ metaCreativeId: await this.api.create(run.account, run.token, 'adcreatives', creativeParams(c, run.ids, hash, run.bookingLink)) });
      }
      if (!c.metaAdId) {
        await save({ metaAdId: await this.api.create(run.account, run.token, 'ads', { name: c.name, adset_id: c.metaAdSetId, creative: { creative_id: c.metaCreativeId }, status: 'ACTIVE' }) });
      }
      await this.api.update(c.metaCampaignId!, run.token, { status: 'ACTIVE' });
      await save({ status: 'in_review', lastError: null, launchedAt: new Date(), metaStatus: 'PENDING_REVIEW' });
    } catch (err) {
      const message = err instanceof MetaApiError ? `Meta said: ${err.message}` : err instanceof Error ? err.message : String(err);
      this.logger.warn(`Launching campaign ${campaignId} failed: ${message}`);
      await this.db.update(adCampaigns).set({ status: 'failed', lastError: message, updatedAt: new Date() }).where(eq(adCampaigns.id, campaignId));
      throw new BadRequestException(`Your ad is paid for, but Meta didn’t accept it yet: ${message} Fix it and tap Try again — you won’t pay twice.`);
    }
  }

  async retryLaunch(vendorId: string, campaignId: string) {
    const c = await this.find(vendorId, campaignId);
    if (c.status !== 'failed') throw new ConflictException('Only ads that failed to launch can be retried.');
    await this.launch(campaignId);
    return this.view(await this.find(vendorId, campaignId));
  }

  /**
   * Cancels an ad that isn't running. Unpaid: just cancelled. Paid on route 1
   * but never launched: the spend and its VAT come back as ad credit.
   */
  async cancel(vendorId: string, campaignId: string) {
    const c = await this.find(vendorId, campaignId);
    if (!['awaiting_payment', 'failed'].includes(c.status)) throw new ConflictException('Live ads can’t be cancelled here yet — they stop on their end date.');
    if (c.metaCampaignId) await this.api.update(c.metaCampaignId, (await this.runner(c)).token, { status: 'PAUSED' }).catch(() => undefined);
    if (c.status === 'failed' && c.route === 'scalio' && c.paidSpendKobo > 0) {
      await this.db.insert(adCreditEntries).values({
        vendorId, campaignId, amountKobo: unspentCreditKobo(c.paidSpendKobo, 0), reason: 'cancelled_before_launch', dedupeKey: `cancel:${campaignId}`,
      }).onConflictDoNothing();
    }
    await this.db.update(adCampaigns).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(adCampaigns.id, campaignId));
    return this.view(await this.find(vendorId, campaignId));
  }

  private async applyExtension(campaignId: string, days: number, extraSpendKobo: number) {
    const [c] = await this.db.select().from(adCampaigns).where(eq(adCampaigns.id, campaignId));
    if (!c || !c.metaAdSetId || !c.metaCampaignId) return;
    const endAt = extendEnd(c.endAt, days, new Date());
    const paidSpendKobo = c.paidSpendKobo + extraSpendKobo;
    const run = await this.runner(c);
    const lifetime = c.route === 'scalio' ? paidSpendKobo : c.dailyBudgetKobo * runDays(c.startAt, endAt);
    try {
      if (c.route === 'scalio') await this.api.update(c.metaCampaignId, run.token, { spend_cap: paidSpendKobo });
      await this.api.update(c.metaAdSetId, run.token, { end_time: endAt.toISOString(), lifetime_budget: lifetime });
      if (c.status === 'completed') await this.api.update(c.metaCampaignId, run.token, { status: 'ACTIVE' });
      await this.db.update(adCampaigns).set({
        endAt, paidSpendKobo, status: c.status === 'completed' ? 'active' : c.status, lastError: null, updatedAt: new Date(),
      }).where(eq(adCampaigns.id, campaignId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Paid but Meta refused the change: keep the money visible on the ad so support can fix it.
      await this.db.update(adCampaigns).set({ paidSpendKobo, lastError: `Extending failed: ${message}`, updatedAt: new Date() }).where(eq(adCampaigns.id, campaignId));
      this.logger.error(`Extending campaign ${campaignId} failed after payment: ${message}`);
    }
  }

  // ── Following the ad on Meta ──────────────────────────────────────────────

  /** Each live campaign about every 15 minutes: Meta's review result, end dates and spend; unspent route-1 budget back as credit. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncAll() {
    if (!this.meta.adsEnabled || !this.meta.graph) return;
    const due = await this.db.select().from(adCampaigns).where(inArray(adCampaigns.status, LIVE_STATUSES)).limit(200);
    for (const c of due) {
      if (c.syncedAt && Date.now() - c.syncedAt.getTime() < 14 * 60_000) continue;
      await this.sync(c).catch((err: unknown) => this.logger.warn(`Sync of campaign ${c.id} failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  }

  async sync(c: Campaign) {
    if (!c.metaAdId || !c.metaCampaignId) return;
    const run = await this.runner(c);
    const [{ effectiveStatus, reviewNote }, spentKobo] = await Promise.all([
      this.api.adStatus(c.metaAdId, run.token),
      this.api.campaignSpendKobo(c.metaCampaignId, run.token),
    ]);
    const now = new Date();
    const status = statusFromMeta(effectiveStatus, c.endAt, now);
    if (status === 'rejected') await this.api.update(c.metaCampaignId, run.token, { status: 'PAUSED' }).catch(() => undefined);
    await this.db.update(adCampaigns).set({ status, metaStatus: effectiveStatus, reviewNote, spentKobo, syncedAt: now, updatedAt: now })
      .where(eq(adCampaigns.id, c.id));
    if ((status === 'completed' || status === 'rejected') && c.route === 'scalio') {
      const credit = unspentCreditKobo(c.paidSpendKobo, spentKobo);
      if (credit > 0) {
        // Keyed on what was paid, so an extension later gets its own refund.
        await this.db.insert(adCreditEntries).values({
          vendorId: c.vendorId, campaignId: c.id, amountKobo: credit, reason: 'unspent_budget', dedupeKey: `unspent:${c.id}:${c.paidSpendKobo}`,
        }).onConflictDoNothing();
      }
    }
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  async list(vendorId: string) {
    const rows = await this.db.select().from(adCampaigns).where(eq(adCampaigns.vendorId, vendorId)).orderBy(desc(adCampaigns.createdAt)).limit(50);
    return { campaigns: rows.map((r) => this.view(r)), creditKobo: await this.creditBalance(vendorId) };
  }

  async get(vendorId: string, campaignId: string) {
    const c = await this.find(vendorId, campaignId);
    const payments = await this.db.select().from(adPayments).where(eq(adPayments.campaignId, campaignId)).orderBy(desc(adPayments.createdAt));
    return {
      ...this.view(c),
      payments: payments.map((p) => ({
        id: p.id, purpose: p.purpose, extraDays: p.extraDays, status: p.status, amountDueKobo: p.amountDueKobo, spendKobo: p.spendKobo,
        vatKobo: p.vatKobo, feeKobo: p.feeKobo, creditUsedKobo: p.creditUsedKobo, paidAt: p.paidAt,
      })),
      quoteForExtension: Object.fromEntries(
        await Promise.all([7, 14, 30].map(async (d) => [d, await this.quote(vendorId, c.dailyBudgetKobo, d, c.route)] as const)),
      ),
    };
  }

  private view(c: Campaign) {
    const { vendorId: _v, createdById: _c, ...rest } = c;
    return { ...rest, days: runDays(c.startAt, c.endAt), objectiveLabel: OBJECTIVES[c.objective].label };
  }

  private async find(vendorId: string, campaignId: string): Promise<Campaign> {
    const [c] = await this.db.select().from(adCampaigns).where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.vendorId, vendorId)));
    if (!c) throw new NotFoundException('Ad not found');
    return c;
  }

  /** The ad account, token and Page ids a campaign runs with. */
  private async runner(c: Campaign): Promise<{ account: string; token: string; ids: MetaIds; bookingLink: string }> {
    const { page, instagram, userToken, own } = await this.connections(c.vendorId);
    if (!page) throw new Error('Your Facebook Page isn’t connected any more. Reconnect it in Ads setup.');
    const [vendor] = await this.db.select({ slug: vendors.slug }).from(vendors).where(eq(vendors.id, c.vendorId));
    const bookingLink = this.homeData.bookingLinkFor(vendor?.slug ?? '');
    if (c.route === 'scalio') {
      if (!this.ads.scalioToken) throw new Error('Paying with Scalio isn’t switched on on this server.');
      // Scalio's account advertises as the Page; Instagram uses the Page's linked account.
      return { account: c.metaAdAccountId ?? this.ads.scalioAccountFor(c.vendorId), token: this.ads.scalioToken, ids: { pageId: page.externalId, instagramUserId: null }, bookingLink };
    }
    if (!userToken) throw new Error('Your Facebook login for ads has expired. Reconnect Facebook in Ads setup.');
    const account = c.metaAdAccountId ?? own?.metaAdAccountId;
    if (!account) throw new Error('Choose your Meta ad account in Ads setup.');
    return { account, token: userToken, ids: { pageId: page.externalId, instagramUserId: instagram?.externalId ?? null }, bookingLink };
  }

  /** Route 1 needs the vendor's Page to let Scalio's business advertise for it. Asks once, then checks. */
  private async ensurePageAccess(vendorId: string) {
    const { page } = await this.connections(vendorId);
    if (!page) throw new BadRequestException('Connect your Facebook Page first.');
    const [row] = await this.db.select().from(scalioPageAccess).where(eq(scalioPageAccess.vendorId, vendorId));
    if (row?.status === 'approved' && row.pageId === page.externalId) return;
    const businessId = this.ads.scalioBusinessId!;
    const token = this.ads.scalioToken!;
    if (await this.api.hasPageAccess(businessId, token, page.externalId).catch(() => false)) {
      await this.db.insert(scalioPageAccess).values({ vendorId, pageId: page.externalId, status: 'approved', approvedAt: new Date() })
        .onConflictDoUpdate({ target: scalioPageAccess.vendorId, set: { pageId: page.externalId, status: 'approved', approvedAt: new Date() } });
      return;
    }
    if (!row || row.pageId !== page.externalId) {
      await this.api.requestPageAccess(businessId, token, page.externalId).catch((err: unknown) =>
        this.logger.warn(`Page access request failed: ${err instanceof Error ? err.message : String(err)}`));
      await this.db.insert(scalioPageAccess).values({ vendorId, pageId: page.externalId, status: 'requested' })
        .onConflictDoUpdate({ target: scalioPageAccess.vendorId, set: { pageId: page.externalId, status: 'requested', requestedAt: new Date() } });
    }
    throw new BadRequestException(
      `One-time step: Scalio has asked to run ads for ${page.displayName}. Approve it in Facebook (Meta Business Suite → Settings → Requests), then tap Pay again.`,
    );
  }

  private async payerEmail(vendorId: string, staffId: string): Promise<string> {
    const [s] = await this.db.select({ email: staff.email }).from(staff).where(eq(staff.id, staffId));
    if (s?.email) return s.email;
    const [v] = await this.db.select({ email: vendors.ownerEmail }).from(vendors).where(eq(vendors.id, vendorId));
    if (v?.email) return v.email;
    throw new BadRequestException('Add an email address to your account to pay for ads.');
  }

  private async wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof MetaApiError) {
        if (err.needsReconnect) throw new BadRequestException('Facebook stopped Scalio’s access to your ads. Reconnect Facebook in Ads setup.');
        throw new BadRequestException(`Meta said: ${err.message}`);
      }
      throw err;
    }
  }
}

/** The likeliest city in a free-text Nigerian address ("12 Allen Ave, Ikeja, Lagos" → "Lagos"). */
export function guessCity(address: string | null): string {
  const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const last = parts.at(-1)?.replace(/\b(state|nigeria)\b/gi, '').trim();
  return last || parts.at(-2) || 'Lagos';
}
