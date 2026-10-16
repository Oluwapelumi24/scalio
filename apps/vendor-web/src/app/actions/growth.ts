'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { CaptionDraft, ContentPlatform, ContentPost, Lead, LeadFields, LeadSource, PostFields } from '@/lib/growth'

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
const CONTENT = ['/dashboard/content', '/dashboard']
const LEADS = ['/dashboard/leads', '/dashboard']

// ── Content studio ──────────────────────────────────────────────────────────

export async function uploadMedia(mimeType: string, dataBase64: string) {
  return call<{ id: string }>('/vendor-admin/content/media', json('POST', { mimeType, dataBase64 }), [])
}

export async function writeCaption(data: { brief: string; tone: string; platforms: ContentPlatform[]; mediaId?: string }) {
  return call<CaptionDraft>('/vendor-admin/content/captions', json('POST', data), [])
}

export async function savePost(id: string | null, fields: PostFields) {
  return id
    ? call<ContentPost>(`/vendor-admin/content/posts/${id}`, json('PATCH', fields), CONTENT)
    : call<ContentPost>('/vendor-admin/content/posts', json('POST', fields), CONTENT)
}

export async function planPost(id: string, plannedFor: string) {
  return call<ContentPost>(`/vendor-admin/content/posts/${id}/plan`, json('POST', { plannedFor }), CONTENT)
}

export async function unplanPost(id: string) {
  return call<ContentPost>(`/vendor-admin/content/posts/${id}/unplan`, json('POST'), CONTENT)
}

export async function markPosted(id: string, platforms: ContentPlatform[]) {
  return call<ContentPost>(`/vendor-admin/content/posts/${id}/posted`, json('POST', { platforms }), CONTENT)
}

export async function deletePost(id: string) {
  return call(`/vendor-admin/content/posts/${id}`, { method: 'DELETE' }, CONTENT)
}

// ── Leads ───────────────────────────────────────────────────────────────────

export async function createLead(fields: LeadFields & { name: string; source: LeadSource }) {
  return call<Lead>('/vendor-admin/leads', json('POST', fields), LEADS)
}

export async function updateLead(id: string, fields: LeadFields) {
  return call<Lead>(`/vendor-admin/leads/${id}`, json('PATCH', fields), [...LEADS, `/dashboard/leads/${id}`])
}

export async function convertLead(id: string) {
  return call<Lead>(`/vendor-admin/leads/${id}/convert`, json('POST'), [...LEADS, `/dashboard/leads/${id}`, '/dashboard/customers'])
}

export async function deleteLead(id: string) {
  return call(`/vendor-admin/leads/${id}`, { method: 'DELETE' }, LEADS)
}
