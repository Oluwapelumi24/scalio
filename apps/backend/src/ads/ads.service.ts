import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { decryptPii } from '../common/crypto';
import { DB, type Database } from '../db/db.module';
import { adAccounts, metaUserAccess, socialConnections } from '../db/schema';
import { MetaConfig } from '../social/meta-config';
import { MetaApiError, type MetaAdAccount } from '../social/meta-graph';
import { adAccountProblem, buildSetup } from './ads-setup';

/** Meta's "no permission" codes: the person no longer has a role on that ad account. */
const lostAdAccountAccess = (err: MetaApiError) => err.code === 10 || err.code === 200;

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly meta: MetaConfig,
  ) {}

  /** Why the Ads Manager can't be used on this server, or null when it can. */
  private get unavailableReason(): string | null {
    if (!this.meta.adsEnabled) return 'Ads aren’t switched on in Scalio yet.';
    return this.meta.unavailableReason;
  }

  /** The connect checklist. */
  async setup(vendorId: string) {
    const [connections, [access], [acct]] = await Promise.all([
      this.db.select({ platform: socialConnections.platform, status: socialConnections.status, displayName: socialConnections.displayName })
        .from(socialConnections).where(eq(socialConnections.vendorId, vendorId)),
      this.db.select({ grantedScopes: metaUserAccess.grantedScopes, expiresAt: metaUserAccess.expiresAt })
        .from(metaUserAccess).where(eq(metaUserAccess.vendorId, vendorId)),
      this.db.select().from(adAccounts).where(eq(adAccounts.vendorId, vendorId)),
    ]);
    const conn = (p: 'facebook' | 'instagram') => connections.find((c) => c.platform === p) ?? null;
    const setup = buildSetup({
      now: new Date(),
      facebook: conn('facebook'),
      instagram: conn('instagram'),
      access: access ?? null,
      adAccount: acct
        ? {
            id: acct.metaAdAccountId, name: acct.name, currency: acct.currency, metaStatus: acct.metaStatus, status: acct.status,
            ownedBy: acct.ownedBy, hasPaymentMethod: acct.hasPaymentMethod, paymentMethodLabel: acct.paymentMethodLabel,
          }
        : null,
    });
    const reason = this.unavailableReason;
    return { available: reason === null, unavailableReason: reason, ...setup };
  }

  /** Ad accounts the person who connected can advertise from, straight from Meta. */
  async listAdAccounts(vendorId: string) {
    const accounts = await this.withToken(vendorId, (graph, token) => graph.adAccounts(token));
    const [chosen] = await this.db.select({ id: adAccounts.metaAdAccountId }).from(adAccounts).where(eq(adAccounts.vendorId, vendorId));
    return accounts.map((a) => ({ ...this.view(a), chosen: a.id === chosen?.id }));
  }

  async chooseAdAccount(vendorId: string, staffId: string, adAccountId: string) {
    const accounts = await this.withToken(vendorId, (graph, token) => graph.adAccounts(token));
    const a = accounts.find((x) => x.id === adAccountId);
    if (!a) throw new NotFoundException('Choose one of the ad accounts listed.');
    const values = {
      metaAdAccountId: a.id, name: a.name, currency: a.currency, timezone: a.timezone, ownedBy: 'vendor' as const, metaStatus: a.status,
      hasPaymentMethod: a.hasPaymentMethod, paymentMethodLabel: a.paymentMethodLabel, status: 'active' as const, lastError: null,
      checkedAt: new Date(), chosenById: staffId, updatedAt: new Date(),
    };
    await this.db.insert(adAccounts).values({ vendorId, ...values }).onConflictDoUpdate({ target: adAccounts.vendorId, set: values });
    return this.setup(vendorId);
  }

  /** Re-reads the chosen ad account from Meta — e.g. after the vendor added a card there. */
  async refreshAdAccount(vendorId: string) {
    const [acct] = await this.db.select({ id: adAccounts.metaAdAccountId }).from(adAccounts).where(eq(adAccounts.vendorId, vendorId));
    if (!acct) throw new BadRequestException('Choose an ad account first.');
    try {
      // Permission errors come back raw so they can mark the account rather than fail the request.
      const a = await this.withToken(vendorId, (graph, token) => graph.adAccount(acct.id, token), lostAdAccountAccess);
      await this.db.update(adAccounts).set({
        name: a.name, currency: a.currency, timezone: a.timezone, metaStatus: a.status, hasPaymentMethod: a.hasPaymentMethod,
        paymentMethodLabel: a.paymentMethodLabel, status: 'active', lastError: null, checkedAt: new Date(), updatedAt: new Date(),
      }).where(eq(adAccounts.vendorId, vendorId));
    } catch (err) {
      if (err instanceof MetaApiError && lostAdAccountAccess(err)) {
        // The person lost their role on the ad account (or it was removed).
        await this.db.update(adAccounts).set({ status: 'needs_reconnect', lastError: err.message, updatedAt: new Date() }).where(eq(adAccounts.vendorId, vendorId));
      } else {
        throw err;
      }
    }
    return this.setup(vendorId);
  }

  private view(a: MetaAdAccount) {
    return {
      id: a.id, name: a.name, currency: a.currency, businessName: a.businessName,
      hasPaymentMethod: a.hasPaymentMethod, paymentMethodLabel: a.paymentMethodLabel, problem: adAccountProblem(a.status),
    };
  }

  /** Runs a Marketing API call with the business's stored user token, turning Meta errors into plain ones. */
  private async withToken<T>(
    vendorId: string,
    fn: (graph: NonNullable<MetaConfig['graph']>, token: string) => Promise<T>,
    passThrough: (err: MetaApiError) => boolean = () => false,
  ): Promise<T> {
    const reason = this.unavailableReason;
    if (reason) throw new ServiceUnavailableException(reason);
    const [access] = await this.db.select().from(metaUserAccess).where(eq(metaUserAccess.vendorId, vendorId));
    if (!access || !access.grantedScopes.includes('ads_management')) {
      throw new BadRequestException('Reconnect Facebook and allow Scalio to manage ads first.');
    }
    if (access.expiresAt && access.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Your Facebook login for ads has expired. Reconnect Facebook to continue.');
    }
    try {
      return await fn(this.meta.graph!, decryptPii(access.tokenEnc));
    } catch (err) {
      if (err instanceof MetaApiError && err.needsReconnect) {
        await this.db.update(metaUserAccess).set({ expiresAt: new Date(), updatedAt: new Date() }).where(eq(metaUserAccess.vendorId, vendorId));
        throw new BadRequestException('Facebook stopped Scalio’s access to your ads. Reconnect Facebook to continue.');
      }
      if (err instanceof MetaApiError && passThrough(err)) throw err;
      if (err instanceof MetaApiError) {
        this.logger.warn(`Meta ads call failed for ${vendorId}: ${err.code ?? '-'}/${err.subcode ?? '-'} ${err.message}`);
        if (err.retryable) throw new ServiceUnavailableException('Meta is busy right now. Please try again in a minute.');
        throw new BadRequestException(`Meta said: ${err.message}`);
      }
      throw err;
    }
  }
}
