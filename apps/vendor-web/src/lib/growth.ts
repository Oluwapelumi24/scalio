// Types for the Phase 4 growth API: content studio and leads. Posting to
// Instagram/Facebook/TikTok is manual until those platforms approve Scalio.

export type ContentPlatform = 'instagram' | 'facebook' | 'tiktok' | 'whatsapp'
export type PostStatus = 'draft' | 'planned' | 'posted'

export interface PlatformSpec { id: ContentPlatform; name: string; captionMaxChars: number; hashtagMax: number; needsMedia: boolean; publishing: 'manual' | 'automatic'; manualReason: string }
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
