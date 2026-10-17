import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_GRAPH_VERSION, MetaGraph } from './meta-graph';

/** Permissions asked for when the vendor connects (used unless META_LOGIN_CONFIG_ID is set). */
export const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
] as const;

/**
 * Extra permissions for the Ads Manager: ad accounts and campaigns, plus the
 * messaging and lead permissions the inbox needs (ADS_MANAGER_PLAN.md §1).
 * Only asked for when ADS_MANAGER_ENABLED is on — they need Meta's App Review
 * before anyone outside the Meta app's own roles can grant them.
 */
export const META_ADS_SCOPES = [
  'ads_management',
  'ads_read',
  'pages_manage_ads',
  'pages_manage_metadata',
  'pages_messaging',
  'instagram_manage_messages',
  'leads_retrieval',
] as const;

/**
 * Meta settings. Publishing needs all three of: the Meta app's id and secret,
 * and a public HTTPS address for Scalio's API (Meta redirects logins there and
 * fetches the photos being posted from there). Without them, posting stays manual.
 */
@Injectable()
export class MetaConfig {
  readonly appId: string | undefined;
  readonly appSecret: string | undefined;
  readonly publicApiUrl: string | undefined;
  readonly loginConfigId: string | undefined;
  /** Feature flag for the Ads Manager (connect checklist, ad accounts). */
  readonly adsEnabled: boolean;
  /** Token Meta echoes back when subscribing the webhook (set in the Meta app's Webhooks page). */
  readonly webhookVerifyToken: string | undefined;
  readonly graph: MetaGraph | null;

  constructor(config: ConfigService) {
    this.appId = config.get<string>('META_APP_ID') || undefined;
    this.appSecret = config.get<string>('META_APP_SECRET') || undefined;
    this.publicApiUrl = config.get<string>('PUBLIC_API_URL')?.replace(/\/$/, '') || undefined;
    this.loginConfigId = config.get<string>('META_LOGIN_CONFIG_ID') || undefined;
    this.adsEnabled = config.get<string>('ADS_MANAGER_ENABLED') === 'true';
    this.webhookVerifyToken = config.get<string>('META_WEBHOOK_VERIFY_TOKEN') || undefined;
    const version = config.get<string>('META_GRAPH_VERSION') || DEFAULT_GRAPH_VERSION;
    this.graph = this.appId && this.appSecret ? new MetaGraph(this.appId, this.appSecret, version) : null;
  }

  /** Why publishing through Meta can't happen on this server, or null when it can. */
  get unavailableReason(): string | null {
    if (!this.graph) return "Posting from Scalio isn't switched on yet.";
    if (!this.publicApiUrl?.startsWith('https://')) return "Posting from Scalio needs Scalio's server to be online at a public https:// address.";
    return null;
  }

  /** Permissions to ask for at login. With a Login for Business config, the config decides instead. */
  get scopes(): readonly string[] {
    return this.adsEnabled ? [...META_SCOPES, ...META_ADS_SCOPES] : META_SCOPES;
  }

  get redirectUri(): string {
    return `${this.publicApiUrl}/social/meta/callback`;
  }
}
