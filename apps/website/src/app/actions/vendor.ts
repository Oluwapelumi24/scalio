'use server'

import { ApiError, apiFetch } from '@/lib/api'

export type VendorAuthState = { error?: string; done?: 'registered' | 'signed-in' }

function unreachable(err: unknown): VendorAuthState | null {
  if (err instanceof ApiError) return { error: err.message }
  return { error: 'We could not reach Veno just now. Try again in a moment.' }
}

export async function registerVendorAction(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const ownerName = String(formData.get('ownerName') ?? '').trim()
  const businessName = String(formData.get('businessName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const registrationNumber = String(formData.get('registrationNumber') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (password !== confirm) return { error: 'Passwords do not match.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (!category) return { error: 'Choose what your business does.' }
  if (!address) return { error: 'Add the area you work in, for example Yaba, Lagos.' }

  try {
    await apiFetch('/vendor-auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName,
        businessName,
        email,
        password,
        registrationNumber: registrationNumber || undefined,
        category,
        address,
        phone: phone || undefined,
      }),
    })
  } catch (err) {
    return unreachable(err) ?? { error: 'We could not register your business.' }
  }

  return { done: 'registered' }
}

export async function vendorSignInAction(_prev: VendorAuthState, formData: FormData): Promise<VendorAuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  try {
    await apiFetch('/vendor-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    return unreachable(err) ?? { error: 'We could not sign you in.' }
  }

  return { done: 'signed-in' }
}
