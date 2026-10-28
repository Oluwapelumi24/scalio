'use server'

import { ApiError, apiFetch } from '@/lib/api'

export type FeedbackResult = { ok: true } | { error: string }

export async function submitFeedback(token: string, rating: number, comment: string): Promise<FeedbackResult> {
  try {
    await apiFetch(`/feedback/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify({ rating, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    })
    return { ok: true }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
