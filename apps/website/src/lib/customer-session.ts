import { cookies } from 'next/headers'
import { ApiError, apiFetch } from '@/lib/api'

const COOKIE = 'customer_token'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
}

export async function getCustomerToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

export async function setCustomerToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function clearCustomerToken(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** The signed-in customer, or null when the cookie is missing or no longer valid. */
export async function getCustomer(): Promise<Customer | null> {
  const token = await getCustomerToken()
  if (!token) return null
  try {
    return await apiFetch<Customer>('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  } catch (err) {
    if (err instanceof ApiError) return null
    throw err
  }
}
