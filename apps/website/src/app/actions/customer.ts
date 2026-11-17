'use server'

import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { clearCustomerToken, getCustomer, setCustomerToken } from '@/lib/customer-session'

export interface AuthState {
  error?: string
}

function safeNext(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && value.startsWith('/app') ? value : '/app'
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))
  try {
    const session = await apiFetch<{ accessToken: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await setCustomerToken(session.accessToken)
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  redirect(next)
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNext(formData.get('next'))
  if (password.length < 8) return { error: 'Use 8 or more characters.' }
  try {
    const session = await apiFetch<{ accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    await setCustomerToken(session.accessToken)
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  redirect(next)
}

export async function signOutAction() {
  await clearCustomerToken()
  redirect('/app')
}

export interface SlotResult {
  slots?: string[]
  durationMinutes?: number
  error?: string
}

export async function loadOpenTimes(vendorId: string, date: string, serviceIds: string[]): Promise<SlotResult> {
  const params = new URLSearchParams({ date })
  if (serviceIds.length > 0) params.set('serviceIds', serviceIds.join(','))
  try {
    const res = await apiFetch<{ slots: string[]; durationMinutes: number }>(
      `/vendors/${vendorId}/availability?${params}`,
    )
    return { slots: res.slots, durationMinutes: res.durationMinutes }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export interface BookResult {
  error?: string
  needsSignIn?: boolean
  bookingId?: string
  scheduledAt?: string
}

export async function bookAppointment(input: {
  vendorId: string
  serviceIds: string[]
  scheduledAt: string
  durationMinutes: number
}): Promise<BookResult> {
  const user = await getCustomer()
  if (!user) return { needsSignIn: true }
  try {
    const res = await apiFetch<{ booking: { id: string; scheduledAt: string } }>('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        vendorId: input.vendorId,
        userId: user.id,
        serviceIds: input.serviceIds,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
      }),
    })
    return { bookingId: res.booking.id, scheduledAt: res.booking.scheduledAt }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}
