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
  readonly graph: MetaGraph | null;

  constructor(config: ConfigService) {
    this.appId = config.get<string>('META_APP_ID') || undefined;
    this.appSecret = config.get<string>('META_APP_SECRET') || undefined;
    this.publicApiUrl = config.get<string>('PUBLIC_API_URL')?.replace(/\/$/, '') || undefined;
    this.loginConfigId = config.get<string>('META_LOGIN_CONFIG_ID') || undefined;
    const version = config.get<string>('META_GRAPH_VERSION') || DEFAULT_GRAPH_VERSION;
    this.graph = this.appId && this.appSecret ? new MetaGraph(this.appId, this.appSecret, version) : null;
  }

  /** Why publishing through Meta can't happen on this server, or null when it can. */
  get unavailableReason(): string | null {
    if (!this.graph) return "Posting from Scalio isn't switched on yet.";
    if (!this.publicApiUrl?.startsWith('https://')) return "Posting from Scalio needs Scalio's server to be online at a public https:// address.";
    return null;
  }

  get redirectUri(): string {
    return `${this.publicApiUrl}/social/meta/callback`;
  }
}
