'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { businessToken, clearBusinessSession, setBusinessSession } from '@/lib/business-session'

export type VendorAuthState = { error?: string; email?: string }

interface VendorSession {
  accessToken: string
}

function failure(err: unknown, fallback: string): VendorAuthState {
  if (err instanceof ApiError) return { error: err.message }
  console.error(fallback, err)
  return { error: 'We could not reach Veno just now. Try again in a moment.' }
}

export async function sendSignupCode(email: string): Promise<VendorAuthState> {
  try {
    await apiFetch('/vendor-auth/signup-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return {}
  } catch (err) {
    return failure(err, 'Could not send the signup code')
  }
}

export async function verifySignupCode(email: string, code: string): Promise<VendorAuthState & { proof?: string }> {
  try {
    const data = await apiFetch<{ proof: string }>('/vendor-auth/signup-code/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    return { proof: data.proof }
  } catch (err) {
    return failure(err, 'Could not verify the signup code')
  }
}

export async function registerVendorAction(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const ownerName = String(formData.get('ownerName') ?? '').trim()
  const businessName = String(formData.get('businessName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const proof = String(formData.get('proof') ?? '')
  const category = String(formData.get('category') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (!category) return { error: 'Choose what your business does.' }
  if (!address) return { error: 'Choose your state and local government.' }
  if (!proof) return { error: 'Verify your email before creating the business.' }

  let token: string
  try {
    const data = await apiFetch<VendorSession>('/vendor-auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName,
        businessName,
        email,
        password,
        proof,
        category,
        address,
        phone: phone || undefined,
      }),
    })
    token = data.accessToken
  } catch (err) {
    return failure(err, 'Could not register the business')
  }

  await setBusinessSession(token)
  redirect('/business')
}

export async function vendorSignInAction(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  let token: string
  try {
    const data = await apiFetch<VendorSession>('/vendor-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    token = data.accessToken
  } catch (err) {
    const failed = failure(err, 'Could not sign in')
    return { ...failed, email }
  }

  await setBusinessSession(token)
  redirect('/business')
}

async function authed<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string>) },
  })
}

export async function addServiceAction(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const token = await businessToken()
  if (!token) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const duration = Number(formData.get('duration'))
  const naira = Number(String(formData.get('price') ?? '').replace(/,/g, ''))
  if (!name) return { error: 'Name the service.' }
  if (!Number.isFinite(duration) || duration < 15) return { error: 'Duration should be at least 15 minutes.' }
  if (!Number.isFinite(naira) || naira < 0) return { error: 'Enter the price in naira.' }

  try {
    await authed('/vendor-admin/services', token, {
      method: 'POST',
      body: JSON.stringify({ name, durationMinutes: duration, priceKobo: Math.round(naira * 100) }),
    })
  } catch (err) {
    return failure(err, 'Could not add the service')
  }

  revalidatePath('/business')
  return {}
}

export async function setWeekdayHoursAction(_prev: VendorAuthState, _formData: FormData): Promise<VendorAuthState> {
  const token = await businessToken()
  if (!token) redirect('/login')

  const days = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    opensAtMinutes: 9 * 60,
    closesAtMinutes: 18 * 60,
  }))

  try {
    await authed('/vendor-admin/schedule/hours', token, {
      method: 'PUT',
      body: JSON.stringify({ days }),
    })
  } catch (err) {
    return failure(err, 'Could not save opening hours')
  }

  revalidatePath('/business')
  return {}
}

export async function forgotBusinessPassword(
  _prev: VendorAuthState & { sent?: boolean; email?: string },
  formData: FormData,
): Promise<VendorAuthState & { sent?: boolean; email?: string }> {
  const email = String(formData.get('email') ?? '').trim()
  try {
    await apiFetch('/vendor-auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  } catch (err) {
    if (!(err instanceof ApiError)) return failure(err, 'Could not send a password reset code')
  }
  return { sent: true, email }
}

export async function resetBusinessPassword(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const code = String(formData.get('code') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  let token: string
  try {
    const data = await apiFetch<VendorSession>('/vendor-auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, password }),
    })
    token = data.accessToken
  } catch (err) {
    return failure(err, 'Could not reset the password')
  }

  await setBusinessSession(token)
  redirect('/business')
}

export async function signOutBusinessAction(): Promise<void> {
  await clearBusinessSession()
  redirect('/login')
}
