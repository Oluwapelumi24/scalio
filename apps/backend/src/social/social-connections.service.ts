import { BadRequestException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import type Redis from 'ioredis';
import { randomBytes } from 'node:crypto';
import { decryptPii, encryptPii } from '../common/crypto';
import { DB, type Database } from '../db/db.module';
import { adAccounts, metaUserAccess, socialConnections } from '../db/schema';
import { REDIS } from '../redis/redis.module';
import { MetaConfig } from './meta-config';
import type { MetaPage } from './meta-graph';

type Platform = 'facebook' | 'instagram';
export type ReturnTo = 'web' | 'web-ads' | 'mobile';

interface OAuthState { vendorId: string; staffId: string; returnTo: ReturnTo }
interface PendingChoice extends OAuthState { metaUserId: string; pages: (Omit<MetaPage, 'accessToken'> & { tokenEnc: string })[] }

/** What the callback page tells the person, and where it sends them back to. */
export interface ConnectOutcome {
  kind: 'connected' | 'choose' | 'error';
  title: string;
  message: string;
  returnUrl: string | null;
  pendingId?: string;
  pages?: { id: string; name: string; instagram: string | null }[];
}

const STATE_TTL = 10 * 60;

@Injectable()
export class SocialConnectionsService {
  private readonly logger = new Logger(SocialConnectionsService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly meta: MetaConfig,
    private readonly config: ConfigService,
  ) {}

  private returnUrl(to: ReturnTo): string | null {
    if (to === 'mobile') return null; // the person switches back to the app; it refreshes on focus
    const web = this.config.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001';
    return `${web.replace(/\/$/, '')}${to === 'web-ads' ? '/dashboard/ads' : '/dashboard/content/connections'}`;
  }

  /** Connected accounts, without tokens. */
  async list(vendorId: string) {
    const rows = await this.db
      .select({
        platform: socialConnections.platform, displayName: socialConnections.displayName, status: socialConnections.status,
        lastError: socialConnections.lastError, connectedAt: socialConnections.connectedAt,
      })
      .from(socialConnections)
      .where(eq(socialConnections.vendorId, vendorId));
    return { available: this.meta.unavailableReason === null, unavailableReason: this.meta.unavailableReason, connections: rows };
  }

  /** The decrypted Page token and account id, for publishing. Null when not connected or needing reconnection. */
  async credentials(vendorId: string, platform: Platform): Promise<{ externalId: string; token: string } | null> {
    const [row] = await this.db
      .select({ externalId: socialConnections.externalId, tokenEnc: socialConnections.accessTokenEnc, status: socialConnections.status })
      .from(socialConnections)
      .where(and(eq(socialConnections.vendorId, vendorId), eq(socialConnections.platform, platform)));
    if (!row || row.status !== 'active') return null;
    return { externalId: row.externalId, token: decryptPii(row.tokenEnc) };
  }

  async markNeedsReconnect(vendorId: string, platform: Platform, reason: string) {
    await this.db
      .update(socialConnections)
      .set({ status: 'needs_reconnect', lastError: reason, updatedAt: new Date() })
      .where(and(eq(socialConnections.vendorId, vendorId), eq(socialConnections.platform, platform)));
  }

  /** Disconnect removes everything Meta gave Scalio for this business, including ad access. */
  async disconnect(vendorId: string) {
    await this.db.transaction(async (tx) => {
      await tx.delete(socialConnections).where(eq(socialConnections.vendorId, vendorId));
      await tx.delete(metaUserAccess).where(eq(metaUserAccess.vendorId, vendorId));
      await tx.delete(adAccounts).where(and(eq(adAccounts.vendorId, vendorId), eq(adAccounts.ownedBy, 'vendor')));
    });
  }

  /** Step 1: the Facebook Login link. State is single-use and expires in 10 minutes. */
  async connectUrl(vendorId: string, staffId: string, returnTo: ReturnTo): Promise<string> {
    const reason = this.meta.unavailableReason;
    if (reason) throw new ServiceUnavailableException(reason);
    const state = randomBytes(24).toString('base64url');
    await this.redis.set(`meta:oauth:${state}`, JSON.stringify({ vendorId, staffId, returnTo } satisfies OAuthState), 'EX', STATE_TTL);
    return this.meta.graph!.loginUrl(this.meta.redirectUri, state, { configId: this.meta.loginConfigId, scopes: this.meta.scopes });
  }

  /** Step 2: Meta sends the person back here after login. */
  async handleCallback(q: { code?: string; state?: string; error?: string; error_reason?: string }): Promise<ConnectOutcome> {
    const raw = q.state ? await this.redis.getdel(`meta:oauth:${q.state}`) : null;
    if (!raw) {
      return { kind: 'error', title: 'This link has expired', message: 'Go back to Scalio and tap Connect again.', returnUrl: this.returnUrl('web') };
    }
    const st = JSON.parse(raw) as OAuthState;
    const back = this.returnUrl(st.returnTo);
    if (q.error || !q.code) {
      return { kind: 'error', title: 'Not connected', message: 'Facebook login was cancelled, so nothing was connected.', returnUrl: back };
    }

    const graph = this.meta.graph!;
    try {
      const { token: userToken, expiresAt } = await graph.userTokenFromCode(q.code, this.meta.redirectUri);
      const [me, pages] = await Promise.all([graph.me(userToken), graph.pages(userToken)]);
      if (this.meta.adsEnabled) {
        // Ad access is extra: if saving it fails, posting still gets connected.
        await this.saveUserAccess(st, me.id, userToken, expiresAt).catch((err: unknown) =>
          this.logger.warn(`Couldn't save Meta ad access: ${err instanceof Error ? err.message : String(err)}`));
      }
      if (pages.length === 0) {
        return {
          kind: 'error', title: 'No Facebook Page found', returnUrl: back,
          message: "Scalio posts to a business's Facebook Page and the Instagram account linked to it. Create a Page (or ask for a role on your business's Page), then connect again.",
        };
      }
      if (pages.length === 1) return this.save(st, me.id, pages[0]);

      const pendingId = randomBytes(18).toString('base64url');
      const pending: PendingChoice = {
        ...st, metaUserId: me.id,
        pages: pages.map(({ accessToken, ...p }) => ({ ...p, tokenEnc: encryptPii(accessToken) })),
      };
      await this.redis.set(`meta:pending:${pendingId}`, JSON.stringify(pending), 'EX', STATE_TTL);
      return {
        kind: 'choose', title: 'Which Page is your business?', message: 'Scalio will post to this Page and the Instagram account linked to it.',
        returnUrl: back, pendingId, pages: pages.map((p) => ({ id: p.id, name: p.name, instagram: p.instagram?.username ?? null })),
      };
    } catch (err) {
      this.logger.warn(`Meta connect failed: ${err instanceof Error ? err.message : String(err)}`);
      return { kind: 'error', title: 'Not connected', message: "We couldn't finish connecting to Facebook. Please try again.", returnUrl: back };
    }
  }

  /**
   * Ads Manager: keep the user token (encrypted) for the Marketing API, with the
   * permissions actually granted. If the person has exactly one ad account and
   * none is chosen yet, choose it so the checklist has one less step.
   */
  private async saveUserAccess(st: OAuthState, metaUserId: string, userToken: string, expiresAt: Date | null) {
    const graph = this.meta.graph!;
    const grantedScopes = await graph.grantedPermissions(userToken);
    const values = { metaUserId, tokenEnc: encryptPii(userToken), expiresAt, grantedScopes, connectedById: st.staffId, updatedAt: new Date() };
    await this.db.insert(metaUserAccess).values({ vendorId: st.vendorId, ...values }).onConflictDoUpdate({ target: metaUserAccess.vendorId, set: values });
    // A fresh login fixes an ad account that needed reconnecting.
    await this.db.update(adAccounts).set({ status: 'active', lastError: null, updatedAt: new Date() }).where(eq(adAccounts.vendorId, st.vendorId));

    if (!grantedScopes.includes('ads_management')) return;
    try {
      const [existing] = await this.db.select({ id: adAccounts.metaAdAccountId }).from(adAccounts).where(eq(adAccounts.vendorId, st.vendorId));
      const accounts = existing ? [] : await graph.adAccounts(userToken);
      if (accounts.length === 1) {
        const a = accounts[0];
        await this.db.insert(adAccounts).values({
          vendorId: st.vendorId, metaAdAccountId: a.id, name: a.name, currency: a.currency, timezone: a.timezone, metaStatus: a.status,
          hasPaymentMethod: a.hasPaymentMethod, paymentMethodLabel: a.paymentMethodLabel, chosenById: st.staffId,
        }).onConflictDoNothing();
      }
    } catch (err) {
      // Not fatal: the vendor can pick an ad account from the checklist.
      this.logger.warn(`Couldn't list ad accounts after login: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Step 3 (several Pages): the person picked one. */
  async choosePage(pendingId: string, pageId: string): Promise<ConnectOutcome> {
    const raw = await this.redis.getdel(`meta:pending:${pendingId}`);
    if (!raw) return { kind: 'error', title: 'This link has expired', message: 'Go back to Scalio and tap Connect again.', returnUrl: this.returnUrl('web') };
    const p = JSON.parse(raw) as PendingChoice;
    const page = p.pages.find((x) => x.id === pageId);
    if (!page) throw new BadRequestException('Choose one of the Pages listed.');
    return this.save(p, p.metaUserId, { ...page, accessToken: decryptPii(page.tokenEnc) });
  }

  /** Stores the Page (and its Instagram account), replacing any earlier connection. */
  private async save(st: OAuthState, metaUserId: string, page: MetaPage): Promise<ConnectOutcome> {
    const tokenEnc = encryptPii(page.accessToken);
    const rows: (typeof socialConnections.$inferInsert)[] = [
      { vendorId: st.vendorId, platform: 'facebook', externalId: page.id, displayName: page.name, accessTokenEnc: tokenEnc, metaUserId, connectedById: st.staffId },
    ];
    if (page.instagram) {
      rows.push({
        vendorId: st.vendorId, platform: 'instagram', externalId: page.instagram.id, displayName: page.instagram.username ? `@${page.instagram.username}` : 'Instagram',
        accessTokenEnc: tokenEnc, metaUserId, connectedById: st.staffId,
      });
    }
    await this.db.transaction(async (tx) => {
      await tx.delete(socialConnections).where(eq(socialConnections.vendorId, st.vendorId));
      await tx.insert(socialConnections).values(rows);
    });
    if (this.meta.adsEnabled) {
      // The inbox only hears about a Page's chats once the app is subscribed to it.
      await this.meta.graph!.subscribePageToMessages(page.id, page.accessToken).catch((err: unknown) =>
        this.logger.warn(`Couldn't subscribe Page ${page.id} to message webhooks: ${err instanceof Error ? err.message : String(err)}`));
    }
    return {
      kind: 'connected', title: 'Connected', returnUrl: this.returnUrl(st.returnTo),
      message: page.instagram
        ? `Scalio can now post to ${page.name} on Facebook and @${page.instagram.username} on Instagram.`
        : `Scalio can now post to ${page.name} on Facebook. No Instagram business account is linked to this Page — link one in Instagram's settings, then connect again to post there too.`,
    };
  }

  /** Meta's deauthorise and data-deletion callbacks: forget everything that person connected. */
  async forgetMetaUser(metaUserId: string): Promise<number> {
    const removed = await this.db.delete(socialConnections).where(eq(socialConnections.metaUserId, metaUserId)).returning({ id: socialConnections.id });
    const access = await this.db.delete(metaUserAccess).where(eq(metaUserAccess.metaUserId, metaUserId)).returning({ vendorId: metaUserAccess.vendorId });
    // Their ad accounts were reachable only through that login (Scalio-owned ones stay).
    for (const { vendorId } of access) {
      await this.db.delete(adAccounts).where(and(eq(adAccounts.vendorId, vendorId), eq(adAccounts.ownedBy, 'vendor')));
    }
    return removed.length + access.length;
  }
}

