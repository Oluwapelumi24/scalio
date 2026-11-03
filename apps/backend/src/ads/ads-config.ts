import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FeeSettings } from './campaign-rules';

/**
 * Settings for running ads (ADS_MANAGER_PLAN.md §4–§5).
 *
 * Route 1 ("Pay with Veno") runs vendors' ads on a small pool of ad accounts
 * Veno owns and funds, shared between vendors; each campaign carries its own
 * spend cap so a vendor never spends more than they paid. Without the pool
 * settings, only route 2 (the vendor's own ad account) is offered.
 */
@Injectable()
export class AdsConfig {
  readonly fee: FeeSettings;
  /** Veno's Business Manager id. */
  readonly venoBusinessId: string | undefined;
  /** A system-user token for Veno's Business Manager, with ads_management. */
  readonly venoToken: string | undefined;
  /** Veno-owned, funded NGN ad accounts (`act_…`), comma-separated in the env. */
  readonly venoAdAccounts: string[];

  constructor(config: ConfigService) {
    const pct = Number(config.get('ADS_FEE_PERCENT'));
    const min = Number(config.get('ADS_FEE_MIN_KOBO'));
    this.fee = { percent: Number.isFinite(pct) && pct >= 0 ? pct : 10, minKobo: Number.isFinite(min) && min >= 0 ? min : 100_000 };
    this.venoBusinessId = config.get<string>('META_VENO_BUSINESS_ID') || undefined;
    this.venoToken = config.get<string>('META_VENO_SYSTEM_TOKEN') || undefined;
    this.venoAdAccounts = (config.get<string>('META_VENO_AD_ACCOUNT_IDS') ?? '')
      .split(',').map((s) => s.trim()).filter((s) => /^act_\d+$/.test(s));
  }

  /** Why "Pay with Veno" isn't offered on this server, or null when it is. */
  get venoRouteUnavailable(): string | null {
    if (!this.venoBusinessId || !this.venoToken || this.venoAdAccounts.length === 0) {
      return 'Paying for ads with Veno isn’t switched on yet.';
    }
    return null;
  }

  /** Spreads vendors across the pool by a stable hash, so a vendor's ads stay on one account. */
  venoAccountFor(vendorId: string): string {
    let h = 0;
    for (const ch of vendorId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return this.venoAdAccounts[h % this.venoAdAccounts.length];
  }
}
