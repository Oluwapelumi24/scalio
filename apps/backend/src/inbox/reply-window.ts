import type { InboxChannel } from '../db/schema';

// Meta's messaging windows (ADS_MANAGER_PLAN.md §1, §8):
// - Anyone may reply within 24 hours of the customer's last message.
// - After that, Instagram and Messenger allow a *person* (never automation) to
//   reply for up to 7 days with the HUMAN_AGENT tag.
// - WhatsApp has no human-agent grace: after 24h only a paid template can be sent.
// AI and automated messages are only ever sent inside the 24 hours.

export const STANDARD_WINDOW_MS = 24 * 3_600_000;
export const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 3_600_000;

/**
 * open: free replies; human_agent: a person may reply (tagged), until closesAt;
 * template: WhatsApp needs a paid template; closed: nothing can be sent;
 * none: the customer never wrote, so the business can't start the chat.
 */
export type WindowState = 'open' | 'human_agent' | 'template' | 'closed' | 'none';

export interface ReplyWindow {
  state: WindowState;
  /** When the current state ends (24h mark while open, 7-day mark during human_agent). */
  closesAt: Date | null;
}

export function replyWindow(channel: InboxChannel, lastCustomerMessageAt: Date | null, now: Date): ReplyWindow {
  if (!lastCustomerMessageAt) return { state: 'none', closesAt: null };
  const t = lastCustomerMessageAt.getTime();
  if (now.getTime() < t + STANDARD_WINDOW_MS) return { state: 'open', closesAt: new Date(t + STANDARD_WINDOW_MS) };
  if (channel === 'whatsapp') return { state: 'template', closesAt: null };
  if (now.getTime() < t + HUMAN_AGENT_WINDOW_MS) return { state: 'human_agent', closesAt: new Date(t + HUMAN_AGENT_WINDOW_MS) };
  return { state: 'closed', closesAt: null };
}

export type SendDecision =
  | { ok: true; humanAgentTag: boolean }
  | { ok: false; reason: string };

/** Whether a message may go out now, and whether it needs Meta's HUMAN_AGENT tag. */
export function canSend(channel: InboxChannel, sender: 'ai' | 'vendor', lastCustomerMessageAt: Date | null, now: Date): SendDecision {
  const w = replyWindow(channel, lastCustomerMessageAt, now);
  if (w.state === 'open') return { ok: true, humanAgentTag: false };
  if (sender === 'ai') return { ok: false, reason: 'The AI only replies within 24 hours of the customer’s last message.' };
  switch (w.state) {
    case 'human_agent':
      return { ok: true, humanAgentTag: true };
    case 'template':
      return { ok: false, reason: 'It’s been over 24 hours since this customer wrote. WhatsApp only allows a paid template message now.' };
    case 'none':
      return { ok: false, reason: 'You can reply once the customer has messaged you.' };
    default:
      return { ok: false, reason: 'It’s been over 7 days since this customer wrote, so Meta won’t deliver a reply. Wait for them to message again.' };
  }
}
