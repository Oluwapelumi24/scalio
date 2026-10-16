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

  /** The Facebook Login dialog. `configId` is used for Facebook Login for Business; otherwise `scopes`. */
  loginUrl(redirectUri: string, state: string, opts: { configId?: string; scopes: readonly string[] }): string {
    const qs = new URLSearchParams({ client_id: this.appId, redirect_uri: redirectUri, state, response_type: 'code' });
    if (opts.configId) qs.set('config_id', opts.configId);
    else qs.set('scope', opts.scopes.join(','));
    return `https://www.facebook.com/${this.version}/dialog/oauth?${qs}`;
  }

  /** Code → short-lived user token → long-lived user token (~60 days). */
  async userTokenFromCode(code: string, redirectUri: string): Promise<string> {
    const short = await this.call<{ access_token: string }>('GET', '/oauth/access_token', {
      client_id: this.appId, client_secret: this.appSecret, redirect_uri: redirectUri, code,
    });
    const long = await this.call<{ access_token: string }>('GET', '/oauth/access_token', {
      grant_type: 'fb_exchange_token', client_id: this.appId, client_secret: this.appSecret, fb_exchange_token: short.access_token,
    });
    return long.access_token;
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
