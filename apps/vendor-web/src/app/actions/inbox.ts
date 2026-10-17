'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { AiReplyMode, FaqEntry, HandoffReason, InboxChannel, InboxConversationDetail, InboxSettings } from '@/lib/inbox'

async function call<T = unknown>(path: string, init: RequestInit, paths: string[]): Promise<{ data?: T; error?: string }> {
  const token = await requireToken()
  try {
    const data = await apiFetch<T>(path, token, init)
    for (const p of paths) revalidatePath(p)
    return { data }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

const json = (method: string, body: unknown = {}): RequestInit => ({ method, body: JSON.stringify(body) })
const INBOX = ['/dashboard/inbox']

export async function sendInboxReply(id: string, text: string) {
  return call<InboxConversationDetail>(`/vendor-admin/inbox/conversations/${id}/messages`, json('POST', { text }), INBOX)
}

export async function suggestInboxReply(id: string) {
  return call<{ suggestion: string | null; handoff: { reason: HandoffReason; label: string } | null }>(
    `/vendor-admin/inbox/conversations/${id}/suggest`, json('POST'), [],
  )
}

/** paused: false hands the chat back to the AI and clears "Needs you". */
export async function setConversationAiPaused(id: string, paused: boolean) {
  return call<InboxConversationDetail>(`/vendor-admin/inbox/conversations/${id}/ai`, json('PUT', { paused }), INBOX)
}

export async function updateInboxSettings(patch: { aiModes?: Partial<Record<InboxChannel, AiReplyMode>>; faq?: FaqEntry[] }) {
  return call<InboxSettings>('/vendor-admin/inbox/settings', json('PUT', patch), [...INBOX, '/dashboard/inbox/settings'])
}

export async function draftInboxFaq() {
  return call<{ faq: FaqEntry[] }>('/vendor-admin/inbox/faq/draft', json('POST'), [])
}
