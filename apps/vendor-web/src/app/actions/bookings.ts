'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type BookingActionState = { error: string } | null

export async function cancelBooking(bookingId: string, reason?: string): Promise<BookingActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/bookings/${bookingId}/cancel`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    revalidatePath('/dashboard/bookings')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function completeBooking(bookingId: string): Promise<BookingActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/bookings/${bookingId}/complete`, token, { method: 'POST' })
    revalidatePath('/dashboard/bookings')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function noShowBooking(bookingId: string): Promise<BookingActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/vendor-admin/bookings/${bookingId}/no-show`, token, { method: 'POST' })
    revalidatePath('/dashboard/bookings')
    return null
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
