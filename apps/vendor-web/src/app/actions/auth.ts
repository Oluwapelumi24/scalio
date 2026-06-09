'use server'

import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { clearToken, setToken } from '@/lib/session'

interface VendorSession {
  accessToken: string
  staff: { id: string; vendorId: string; name: string; email: string | null; role: string }
}

export type AuthState = { error: string } | null

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let token: string
  try {
    const data = await apiFetch<VendorSession>('/vendor-auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    token = data.accessToken
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }

  await setToken(token)
  redirect('/dashboard')
}

export async function acceptInviteAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const inviteToken = formData.get('token') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) return { error: 'Passwords do not match.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  let accessToken: string
  try {
    const data = await apiFetch<VendorSession>('/vendor-auth/accept-invite', null, {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken, password }),
    })
    accessToken = data.accessToken
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }

  await setToken(accessToken)
  redirect('/dashboard')
}

export async function logoutAction() {
  await clearToken()
  redirect('/login')
}
