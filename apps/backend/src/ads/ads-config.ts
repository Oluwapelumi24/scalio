import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FeeSettings } from './campaign-rules';

/**
 * Settings for running ads (ADS_MANAGER_PLAN.md §4–§5).
 *
 * Route 1 ("Pay with Scalio") runs vendors' ads on a small pool of ad accounts
 * Scalio owns and funds, shared between vendors; each campaign carries its own
 * spend cap so a vendor never spends more than they paid. Without the pool
 * settings, only route 2 (the vendor's own ad account) is offered.
 */
@Injectable()
export class AdsConfig {
  readonly fee: FeeSettings;
  /** Scalio's Business Manager id. */
  readonly scalioBusinessId: string | undefined;
  /** A system-user token for Scalio's Business Manager, with ads_management. */
  readonly scalioToken: string | undefined;
  /** Scalio-owned, funded NGN ad accounts (`act_…`), comma-separated in the env. */
  readonly scalioAdAccounts: string[];

  constructor(config: ConfigService) {
    const pct = Number(config.get('ADS_FEE_PERCENT'));
    const min = Number(config.get('ADS_FEE_MIN_KOBO'));
    this.fee = { percent: Number.isFinite(pct) && pct >= 0 ? pct : 10, minKobo: Number.isFinite(min) && min >= 0 ? min : 100_000 };
    this.scalioBusinessId = config.get<string>('META_SCALIO_BUSINESS_ID') || undefined;
    this.scalioToken = config.get<string>('META_SCALIO_SYSTEM_TOKEN') || undefined;
    this.scalioAdAccounts = (config.get<string>('META_SCALIO_AD_ACCOUNT_IDS') ?? '')
      .split(',').map((s) => s.trim()).filter((s) => /^act_\d+$/.test(s));
  }

  /** Why "Pay with Scalio" isn't offered on this server, or null when it is. */
  get scalioRouteUnavailable(): string | null {
    if (!this.scalioBusinessId || !this.scalioToken || this.scalioAdAccounts.length === 0) {
      return 'Paying for ads with Scalio isn’t switched on yet.';
    }
    return null;
  }

  /** Spreads vendors across the pool by a stable hash, so a vendor's ads stay on one account. */
  scalioAccountFor(vendorId: string): string {
    let h = 0;
    for (const ch of vendorId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return this.scalioAdAccounts[h % this.scalioAdAccounts.length];
  }
}
