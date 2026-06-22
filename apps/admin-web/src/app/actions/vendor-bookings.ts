'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

type ActionState = { error: string } | null

export async function cancelBookingAction(vendorId: string, bookingId: string, reason?: string): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}/bookings/${bookingId}/cancel`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}/bookings`)
  return null
}

export async function completeBookingAction(vendorId: string, bookingId: string): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}/bookings/${bookingId}/complete`, token, { method: 'POST' })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}/bookings`)
  return null
}

export async function noShowBookingAction(vendorId: string, bookingId: string): Promise<ActionState> {
  const token = await requireToken()
  try {
    await apiFetch(`/super-admin/vendors/${vendorId}/bookings/${bookingId}/no-show`, token, { method: 'POST' })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath(`/dashboard/vendors/${vendorId}/bookings`)
  return null
}
