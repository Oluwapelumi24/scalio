'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

export type BookingActionState = { error: string } | null

export async function createBooking(_prev: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const token = await requireToken()

  const customerName = String(formData.get('customerName') ?? '').trim()
  const customerPhone = String(formData.get('customerPhone') ?? '').trim() || undefined
  const customerEmail = String(formData.get('customerEmail') ?? '').trim() || undefined
  const staffId = String(formData.get('staffId') ?? '').trim() || undefined
  const serviceId = String(formData.get('serviceId') ?? '').trim()
  const scheduledLocal = String(formData.get('scheduledAt') ?? '').trim()

  if (!customerName) return { error: 'Enter the client’s name.' }
  if (!serviceId) return { error: 'Pick a service.' }
  if (!scheduledLocal) return { error: 'Pick a date and time.' }

  const scheduledAt = new Date(scheduledLocal)
  if (Number.isNaN(scheduledAt.getTime())) return { error: 'That date and time isn’t valid.' }

  try {
    await apiFetch('/vendor-admin/bookings', token, {
      method: 'POST',
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerEmail,
        staffId,
        serviceIds: [serviceId],
        scheduledAt: scheduledAt.toISOString(),
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bookings')
  redirect('/dashboard/bookings')
}

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
