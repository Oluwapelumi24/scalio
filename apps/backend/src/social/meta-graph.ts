import { createHmac, timingSafeEqual } from 'node:crypto';

// Thin client for the Meta Graph API (Facebook Pages + Instagram via Facebook
// Login). Plain fetch, so tests can pass a fake. All calls run on the backend;
// the app secret and tokens never reach the apps.

export const DEFAULT_GRAPH_VERSION = 'v25.0';

export type FetchLike = (url: string, init?: { method?: string; body?: URLSearchParams }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number; is_transient?: boolean; error_user_msg?: string };
}

/** A Graph API error, sorted into what Scalio should do about it. */
export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly code: number | undefined,
    readonly subcode: number | undefined,
    readonly transient: boolean,
  ) {
    super(message);
    this.name = 'MetaApiError';
  }

  /** The token was revoked, expired or the password changed: the vendor must reconnect. */
  get needsReconnect(): boolean {
    return this.code === 190 || this.code === 102;
  }

  /** Worth trying again later: rate limits, Meta-side hiccups, network trouble. */
  get retryable(): boolean {
    if (this.needsReconnect) return false;
    return this.transient || this.httpStatus >= 500 || this.httpStatus === 0 || [1, 2, 4, 17, 32, 341, 613, 9004, 9007].includes(this.code ?? -1);
  }
}

export interface MetaPage {
  id: string;
  name: string;
  accessToken: string;
  instagram: { id: string; username: string } | null;
}

export interface MetaAdAccount {
  /** With the `act_` prefix. */
  id: string;
  name: string;
  /** Meta's account_status: 1 active, 2 disabled, 3 unsettled, 7 pending risk review, 9 in grace period, 101 closed. */
  status: number;
  currency: string;
  timezone: string | null;
  hasPaymentMethod: boolean;
  /** e.g. "Visa *1234" — Meta's own masked label. */
  paymentMethodLabel: string | null;
  businessName: string | null;
}

interface RawAdAccount {
  id: string;
  name?: string;
  account_status: number;
  currency: string;
  timezone_name?: string;
  funding_source_details?: { id?: string; display_string?: string };
  business?: { name?: string };
}

const AD_ACCOUNT_FIELDS = 'id,name,account_status,currency,timezone_name,funding_source_details,business{name}';

export function toAdAccount(a: RawAdAccount): MetaAdAccount {
  const funding = a.funding_source_details;
  return {
    id: a.id,
    name: a.name || a.id,
    status: a.account_status,
    currency: a.currency,
    timezone: a.timezone_name ?? null,
    hasPaymentMethod: !!funding?.id,
    paymentMethodLabel: funding?.display_string || null,
    businessName: a.business?.name ?? null,
  };
}

export class MetaGraph {
  constructor(
    private readonly appId: string,
    private readonly appSecret: string,
    readonly version: string = DEFAULT_GRAPH_VERSION,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  private url(path: string) {
    return `https://graph.facebook.com/${this.version}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async call<T>(method: 'GET' | 'POST', path: string, params: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams(params);
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = method === 'GET' ? await this.fetchFn(`${this.url(path)}?${qs}`) : await this.fetchFn(this.url(path), { method: 'POST', body: qs });
    } catch (err) {
      throw new MetaApiError(`Couldn't reach Meta: ${err instanceof Error ? err.message : String(err)}`, 0, undefined, undefined, true);
    }
    const body = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
    if (!res.ok || body.error) {
      const e = body.error ?? {};
      throw new MetaApiError(e.error_user_msg || e.message || `Meta returned HTTP ${res.status}`, res.status, e.code, e.error_subcode, !!e.is_transient);
    }
    return body;
  }

  /**
   * Any Graph call, for the Marketing API code in `ads/`. Objects and arrays
   * are sent as JSON strings, which is how Graph takes them.
   */
  async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, params: Record<string, unknown>, token: string): Promise<T> {
    const flat: Record<string, string> = { access_token: token };
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      flat[k] = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(v);
    }
    return this.call<T>(method === 'DELETE' ? 'POST' : method, path, method === 'DELETE' ? { ...flat, method: 'delete' } : flat);
  }

  /** The Facebook Login dialog. `configId` is used for Facebook Login for Business; otherwise `scopes`. */
  loginUrl(redirectUri: string, state: string, opts: { configId?: string; scopes: readonly string[] }): string {
    const qs = new URLSearchParams({ client_id: this.appId, redirect_uri: redirectUri, state, response_type: 'code' });
    if (opts.configId) qs.set('config_id', opts.configId);
    else qs.set('scope', opts.scopes.join(','));
    return `https://www.facebook.com/${this.version}/dialog/oauth?${qs}`;
  }

  /** Code → short-lived user token → long-lived user token (~60 days). */
  async userTokenFromCode(code: string, redirectUri: string): Promise<{ token: string; expiresAt: Date | null }> {
    const short = await this.call<{ access_token: string }>('GET', '/oauth/access_token', {
      client_id: this.appId, client_secret: this.appSecret, redirect_uri: redirectUri, code,
    });
    const long = await this.call<{ access_token: string; expires_in?: number }>('GET', '/oauth/access_token', {
      grant_type: 'fb_exchange_token', client_id: this.appId, client_secret: this.appSecret, fb_exchange_token: short.access_token,
    });
    return { token: long.access_token, expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null };
  }

  /** Permissions the person granted (they can untick some in the login dialog). */
  async grantedPermissions(userToken: string): Promise<string[]> {
    const r = await this.call<{ data?: { permission: string; status: string }[] }>('GET', '/me/permissions', { access_token: userToken });
    return (r.data ?? []).filter((p) => p.status === 'granted').map((p) => p.permission);
  }

  // ── Ad accounts (Marketing API, user token) ────────────────────────────────

  /** Ad accounts the person can advertise from. */
  async adAccounts(userToken: string): Promise<MetaAdAccount[]> {
    const r = await this.call<{ data?: RawAdAccount[] }>('GET', '/me/adaccounts', { fields: AD_ACCOUNT_FIELDS, limit: '100', access_token: userToken });
    return (r.data ?? []).map(toAdAccount);
  }

  async adAccount(adAccountId: string, userToken: string): Promise<MetaAdAccount> {
    return toAdAccount(await this.call<RawAdAccount>('GET', `/${adAccountId}`, { fields: AD_ACCOUNT_FIELDS, access_token: userToken }));
  }

  async me(userToken: string): Promise<{ id: string; name: string }> {
    return this.call('GET', '/me', { fields: 'id,name', access_token: userToken });
  }

  /** Pages the person can post to. Page tokens from a long-lived user token don't expire. */
  async pages(userToken: string): Promise<MetaPage[]> {
    const r = await this.call<{ data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[] }>(
      'GET', '/me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username}', limit: '100', access_token: userToken },
    );
    return (r.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
      instagram: p.instagram_business_account ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username ?? '' } : null,
    }));
  }

  // ── Facebook Page ──────────────────────────────────────────────────────────

  async pagePhoto(pageId: string, pageToken: string, imageUrl: string, caption: string): Promise<{ postId: string }> {
    const r = await this.call<{ id: string; post_id?: string }>('POST', `/${pageId}/photos`, { url: imageUrl, caption, published: 'true', access_token: pageToken });
    return { postId: r.post_id ?? r.id };
  }

  async pageText(pageId: string, pageToken: string, message: string): Promise<{ postId: string }> {
    const r = await this.call<{ id: string }>('POST', `/${pageId}/feed`, { message, access_token: pageToken });
    return { postId: r.id };
  }

  async pagePostPermalink(postId: string, pageToken: string): Promise<string | null> {
    const r = await this.call<{ permalink_url?: string }>('GET', `/${postId}`, { fields: 'permalink_url', access_token: pageToken });
    return r.permalink_url ?? null;
  }

  // ── Instagram (business account, via the Page token) ───────────────────────

  async igCreateImageContainer(igUserId: string, pageToken: string, imageUrl: string, caption: string): Promise<string> {
    const r = await this.call<{ id: string }>('POST', `/${igUserId}/media`, { image_url: imageUrl, caption, access_token: pageToken });
    return r.id;
  }

  async igContainerStatus(containerId: string, pageToken: string): Promise<'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'> {
    const r = await this.call<{ status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED' }>('GET', `/${containerId}`, { fields: 'status_code', access_token: pageToken });
    return r.status_code;
  }

  async igPublish(igUserId: string, pageToken: string, containerId: string): Promise<string> {
    const r = await this.call<{ id: string }>('POST', `/${igUserId}/media_publish`, { creation_id: containerId, access_token: pageToken });
    return r.id;
  }

  async igPermalink(mediaId: string, pageToken: string): Promise<string | null> {
    const r = await this.call<{ permalink?: string }>('GET', `/${mediaId}`, { fields: 'permalink', access_token: pageToken });
    return r.permalink ?? null;
  }

  // ── Messaging (Messenger Send API + Instagram Messaging, via the Page token) ─

  /**
   * Sends a text reply. `/me/messages` with a Page token is the Page itself, and
   * the same endpoint delivers to Instagram users (IGSIDs) of the linked account.
   * `humanAgent` adds Meta's HUMAN_AGENT tag: a person replying 24h–7d after the
   * customer's last message. Never used for automated messages.
   */
  async sendMessage(pageToken: string, recipientId: string, text: string, humanAgent = false): Promise<{ messageId: string }> {
    const params: Record<string, string> = {
      recipient: JSON.stringify({ id: recipientId }),
      message: JSON.stringify({ text }),
      messaging_type: humanAgent ? 'MESSAGE_TAG' : 'RESPONSE',
      access_token: pageToken,
    };
    if (humanAgent) params.tag = 'HUMAN_AGENT';
    const r = await this.call<{ message_id: string }>('POST', '/me/messages', params);
    return { messageId: r.message_id };
  }

  /** The customer's display name, when Meta shares it. */
  async chatUserName(channel: 'messenger' | 'instagram', userId: string, pageToken: string): Promise<string | null> {
    if (channel === 'instagram') {
      const r = await this.call<{ name?: string; username?: string }>('GET', `/${userId}`, { fields: 'name,username', access_token: pageToken });
      return r.name || (r.username ? `@${r.username}` : null);
    }
    const r = await this.call<{ first_name?: string; last_name?: string }>('GET', `/${userId}`, { fields: 'first_name,last_name', access_token: pageToken });
    return [r.first_name, r.last_name].filter(Boolean).join(' ') || null;
  }

  /** Subscribes Scalio's app to the Page's message webhooks (Messenger, and Instagram DMs of the linked account). */
  async subscribePageToMessages(pageId: string, pageToken: string): Promise<void> {
    await this.call('POST', `/${pageId}/subscribed_apps`, {
      subscribed_fields: 'messages,messaging_postbacks,messaging_referrals,message_echoes',
      access_token: pageToken,
    });
  }
}

/** Checks Meta's `X-Hub-Signature-256: sha256=<hex>` header against the exact request bytes. */
export function verifyWebhookSignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header ?? '');
  if (!m) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  return timingSafeEqual(Buffer.from(m[1], 'hex'), expected);
}

/** Verifies and decodes a Meta `signed_request` (deauthorise and data-deletion callbacks). */
export function parseSignedRequest(signedRequest: string, appSecret: string): { user_id?: string } | null {
  const [sig, payload] = signedRequest.split('.');
  if (!sig || !payload) return null;
  const expected = createHmac('sha256', appSecret).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { user_id?: string };
  } catch {
    return null;
  }
}
