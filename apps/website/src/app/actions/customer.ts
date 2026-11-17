'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { clearCustomerToken, getCustomer, getCustomerToken, setCustomerToken } from '@/lib/customer-session'
import { safeNextPath } from '@/lib/safe-next'
import type { PaymentMode } from '@/lib/payments'

function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s()-]/g, '')
  if (!/^\+?[0-9]{10,15}$/.test(compact)) return null
  return compact
}

export interface AuthState {
  error?: string
}

function safeNext(value: FormDataEntryValue | null): string {
  return safeNextPath(typeof value === 'string' ? value : null)
}

async function customerAuthHeader(): Promise<Record<string, string> | null> {
  const token = await getCustomerToken()
  return token ? { Authorization: `Bearer ${token}` } : null
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
  const phone = normalizePhone(String(formData.get('phone') ?? ''))
  const next = safeNext(formData.get('next'))
  if (password.length < 8) return { error: 'Use 8 or more characters.' }
  if (!phone) return { error: 'Enter a mobile number the business can call, like 0803 000 0000.' }
  try {
    const session = await apiFetch<{ accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
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
  phone?: string
}): Promise<BookResult> {
  const user = await getCustomer()
  const headers = await customerAuthHeader()
  if (!user || !headers) return { needsSignIn: true }
  if (!user.phone) {
    const phone = normalizePhone(input.phone ?? '')
    if (!phone) return { error: 'Add a mobile number so the business can reach you.' }
    try {
      await apiFetch('/auth/phone', { method: 'POST', headers, body: JSON.stringify({ phone }) })
    } catch (err) {
      if (err instanceof ApiError) return { error: err.message }
      throw err
    }
  }
  try {
    const res = await apiFetch<{ booking: { id: string; scheduledAt: string } }>('/bookings', {
      method: 'POST',
      headers,
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

export async function startPayment(
  bookingId: string,
  paymentMode: Exclude<PaymentMode, 'pay_on_arrival'>,
  amountDueKobo: number,
): Promise<{ authorizationUrl?: string; error?: string }> {
  const headers = await customerAuthHeader()
  if (!headers) return { error: 'Sign in to pay.' }
  try {
    const res = await apiFetch<{ payment: { authorizationUrl: string } }>(`/bookings/${bookingId}/payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ paymentMode, amountDueKobo }),
    })
    return { authorizationUrl: res.payment.authorizationUrl }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const headers = await customerAuthHeader()
  if (!headers) return { error: 'Sign in to cancel.' }
  try {
    await apiFetch(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    })
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
  revalidatePath('/app/bookings')
  return {}
}
