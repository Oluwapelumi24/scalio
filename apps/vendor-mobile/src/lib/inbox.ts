import type { ReplyWindow } from './api';

/** "18h 20m", "5 days", "12m". */
export function timeLeft(until: string, now = Date.now()): string {
  const ms = Math.max(0, new Date(until).getTime() - now);
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h ${min % 60}m`;
  return `${Math.floor(h / 24)} days`;
}

/** The 24-hour timer in plain words, and how urgent it is. */
export function windowStatus(w: ReplyWindow, now = Date.now()): { short: string; long: string; tone: 'ok' | 'warn' | 'closed' } {
  switch (w.state) {
    case 'open': {
      const left = timeLeft(w.closesAt!, now);
      const soon = new Date(w.closesAt!).getTime() - now < 3 * 3_600_000;
      return { short: `${left} left`, long: `${left} left to reply. After that, the AI stops and only you can reply.`, tone: soon ? 'warn' : 'ok' };
    }
    case 'human_agent':
      return {
        short: 'You reply',
        long: `Over 24 hours since they wrote, so the AI can’t reply. You can still reply yourself for ${timeLeft(w.closesAt!, now)}.`,
        tone: 'warn',
      };
    case 'template':
      return { short: 'Template only', long: 'Over 24 hours since they wrote. WhatsApp only allows a paid template message now.', tone: 'closed' };
    case 'closed':
      return { short: 'Closed', long: 'Over 7 days since they wrote, so Meta won’t deliver a reply. Wait for them to message again.', tone: 'closed' };
    default:
      return { short: '', long: 'You can reply once the customer messages you.', tone: 'closed' };
  }
}

export function shortTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/** True while an AI first-draft answer still has a "[fill this in]" placeholder. */
export const hasPlaceholder = (text: string) => /\[[^\]]+\]/.test(text);
