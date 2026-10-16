'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export async function markFollowedUp(id: string) {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/feedback/${id}/followed-up`, token, { method: 'POST', body: '{}' })
    revalidatePath('/dashboard/feedback')
    revalidatePath('/dashboard')
    return {}
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

/** The rating link for a completed booking, plus a ready-made WhatsApp message. */
export async function feedbackShare(bookingId: string) {
  const token = await requireToken()
  try {
    return { data: await apiFetch<{ url: string; submitted: boolean; emailed: boolean; phone: string | null; message: string }>(`/vendor-admin/feedback/booking/${bookingId}`, token) }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
