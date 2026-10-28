// Types and helpers for the inbox (Ads Manager Phase 2): Instagram, Messenger and
// WhatsApp chats with AI replies, all inside Meta's 24-hour reply window.

export type InboxChannel = 'instagram' | 'messenger' | 'whatsapp'
export type AiReplyMode = 'off' | 'suggest' | 'reply'
export type HandoffReason = 'complaint' | 'refund' | 'unknown' | 'human_requested'

/** open: free replies; human_agent: a person may reply until closesAt; template: WhatsApp needs a paid template; closed/none: can't reply. */
export interface ReplyWindow { state: 'open' | 'human_agent' | 'template' | 'closed' | 'none'; closesAt: string | null }

export interface InboxConversation {
  id: string
  channel: InboxChannel
  customerName: string
  preview: string | null
  lastMessageAt: string
  unreadCount: number
  window: ReplyWindow
  aiMode: AiReplyMode
  aiPaused: boolean
  leadId: string | null
  adTitle: string | null
  handoff: { reason: HandoffReason; label: string; at: string } | null
}

export interface InboxMessage {
  id: string
  direction: 'in' | 'out'
  sentBy: 'customer' | 'vendor' | 'ai'
  text: string
  attachments: { type: string; url: string | null }[]
  status: 'received' | 'sent' | 'failed'
  humanAgentTag: boolean
  sentAt: string
}

export interface InboxConversationDetail extends InboxConversation { aiSuggestion: string | null; messages: InboxMessage[] }

export interface FaqEntry { question: string; answer: string }

export interface InboxSettings {
  aiAvailable: boolean
  channels: { channel: InboxChannel; connected: boolean; accountName: string | null; comingSoon: boolean; mode: AiReplyMode }[]
  faq: FaqEntry[]
}

export const CHANNEL_LABELS: Record<InboxChannel, string> = { instagram: 'Instagram', messenger: 'Messenger', whatsapp: 'WhatsApp' }
export const AI_MODE_LABELS: Record<AiReplyMode, string> = { off: 'Off', suggest: 'Suggest, I send', reply: 'Reply for me' }

/** "18h 20m", "5 days", "12m". */
export function timeLeft(until: string, now = Date.now()): string {
  const min = Math.floor(Math.max(0, new Date(until).getTime() - now) / 60_000)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  return h < 48 ? `${h}h ${min % 60}m` : `${Math.floor(h / 24)} days`
}

/** The 24-hour timer in plain words, and how urgent it is. */
export function windowStatus(w: ReplyWindow, now = Date.now()): { short: string; long: string; tone: 'ok' | 'warn' | 'closed' } {
  switch (w.state) {
    case 'open': {
      const left = timeLeft(w.closesAt!, now)
      const soon = new Date(w.closesAt!).getTime() - now < 3 * 3_600_000
      return { short: `${left} left`, long: `${left} left to reply. After that, the AI stops and only you can reply.`, tone: soon ? 'warn' : 'ok' }
    }
    case 'human_agent':
      return { short: 'You reply', long: `Over 24 hours since they wrote, so the AI can’t reply. You can still reply yourself for ${timeLeft(w.closesAt!, now)}.`, tone: 'warn' }
    case 'template':
      return { short: 'Template only', long: 'Over 24 hours since they wrote. WhatsApp only allows a paid template message now.', tone: 'closed' }
    case 'closed':
      return { short: 'Closed', long: 'Over 7 days since they wrote, so Meta won’t deliver a reply. Wait for them to message again.', tone: 'closed' }
    default:
      return { short: '', long: 'You can reply once the customer messages you.', tone: 'closed' }
  }
}

export function shortTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
  const days = (now.getTime() - d.getTime()) / 86_400_000
  if (days < 7) return d.toLocaleDateString('en-NG', { weekday: 'short' })
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

/** True while an AI first-draft answer still has a "[fill this in]" placeholder. */
export const hasPlaceholder = (text: string) => /\[[^\]]+\]/.test(text)
