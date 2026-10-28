// Types for the Phase 4 growth API: content studio and leads. Posting to
// Instagram/Facebook/TikTok is manual until those platforms approve Scalio.

export type ContentPlatform = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp'
export type PostStatus = 'draft' | 'planned' | 'posted'

export interface PlatformSpec {
  id: ContentPlatform
  name: string
  captionMaxChars: number
  hashtagMax: number
  needsMedia: boolean
  /** Per business: `automatic` once its account is connected. */
  publishing: 'manual' | 'automatic'
  manualReason: string
  connection: { displayName: string; status: 'active' | 'needs_reconnect'; lastError: string | null } | null
  canConnect: boolean
}

export type PublicationStatus = 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled'
export interface Publication { id: string; platform: 'facebook' | 'instagram'; status: PublicationStatus; runAt: string; attempts: number; permalink: string | null; error: string | null; publishedAt: string | null }

export interface SocialConnections {
  available: boolean
  unavailableReason: string | null
  connections: { platform: 'facebook' | 'instagram'; displayName: string; status: 'active' | 'needs_reconnect'; lastError: string | null; connectedAt: string }[]
}
// ── Ads Manager ─────────────────────────────────────────────────────────────

export type AdsStepAction =
  | { kind: 'connect' }
  | { kind: 'choose_ad_account' }
  | { kind: 'open_url'; url: string; label: string }

export interface AdsSetupStep {
  key: 'facebook' | 'instagram' | 'ad_access' | 'ad_account' | 'payment_method' | 'whatsapp'
  title: string
  state: 'done' | 'todo' | 'attention' | 'waiting' | 'coming_soon'
  detail: string
  optional: boolean
  action: AdsStepAction | null
}

export interface AdsSetup { available: boolean; unavailableReason: string | null; ready: boolean; steps: AdsSetupStep[] }

export interface MetaAdAccountOption {
  id: string
  name: string
  currency: string
  businessName: string | null
  hasPaymentMethod: boolean
  paymentMethodLabel: string | null
  problem: string | null
  chosen: boolean
}

export interface StudioInfo { ai: { available: boolean; dailyLimit: number; usedToday: number }; tones: { id: string; label: string }[]; platforms: PlatformSpec[] }
export interface PlatformCheck { platform: ContentPlatform; text: string; problems: string[]; notes: string[] }

export interface ContentPost {
  id: string
  mediaId: string | null
  brief: string | null
  tone: string | null
  caption: string
  hashtags: string[]
  callToAction: string | null
  platforms: ContentPlatform[]
  status: PostStatus
  plannedFor: string | null
  postedAt: string | null
  postedPlatforms: ContentPlatform[]
  aiGenerated: boolean
  updatedAt: string
  checks: PlatformCheck[]
  publications: Publication[]
}

export interface PostFields {
  mediaId?: string | null
  brief?: string | null
  tone?: string | null
  caption?: string
  hashtags?: string[]
  callToAction?: string | null
  platforms?: ContentPlatform[]
  aiGenerated?: boolean
}

export interface CaptionDraft { caption: string; hashtags: string[]; callToAction: string }

export const mediaUrl = (id: string) => `/dashboard/content/media/${id}`

export type LeadSource = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'booking_page' | 'referral' | 'walk_in' | 'other'
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost'

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', whatsapp: 'WhatsApp',
  booking_page: 'Booking page', referral: 'Referral', walk_in: 'Walk-in', other: 'Other',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', won: 'Became a customer', lost: 'Not interested',
}

export interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: LeadSource
  note: string | null
  status: LeadStatus
  followUpAt: string | null
  createdAt: string
  assignedStaff: { id: string; name: string | null } | null
  customer: { id: string; name: string | null } | null
  due: boolean
}

export interface LeadFields {
  name?: string
  phone?: string | null
  email?: string | null
  source?: LeadSource
  note?: string | null
  status?: 'new' | 'contacted' | 'lost'
  assignedStaffId?: string | null
  followUpAt?: string | null
}

/** wa.me wants the number in international form without '+' — assume Nigeria for local 0-numbers. */
export function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits
}
