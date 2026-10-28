import type { AdCampaignStatus } from './api';
import type { Colors } from '../theme';

/** How each ad status reads in the app. */
export const AD_STATUS = (colors: Colors): Record<AdCampaignStatus, { label: string; fg: string; bg: string }> => ({
  awaiting_payment: { label: 'Waiting for payment', fg: colors.warning, bg: colors.warningLight },
  launching: { label: 'Sending to Meta', fg: colors.accent, bg: colors.accentLight },
  in_review: { label: 'In review', fg: colors.accent, bg: colors.accentLight },
  active: { label: 'Live', fg: colors.success, bg: colors.successLight },
  paused: { label: 'Paused', fg: colors.textSecondary, bg: colors.mist },
  completed: { label: 'Finished', fg: colors.textSecondary, bg: colors.mist },
  rejected: { label: 'Not approved', fg: colors.error, bg: colors.errorLight },
  failed: { label: 'Needs attention', fg: colors.error, bg: colors.errorLight },
  cancelled: { label: 'Cancelled', fg: colors.textMuted, bg: colors.mist },});

/** The journey of a paid ad, for the progress bar on the ad's page. */
export const AD_JOURNEY = ['Payment', 'Sent to Meta', 'In review', 'Live', 'Finished'];

/** Where an ad is on that journey (index into AD_JOURNEY), or null when it's off the happy path. */
export function journeyIndex(status: AdCampaignStatus): number | null {
  switch (status) {
    case 'awaiting_payment': return 0;
    case 'launching': return 1;
    case 'in_review': return 2;
    case 'active':
    case 'paused': return 3;
    case 'completed': return 4;
    default: return null;
  }
}
