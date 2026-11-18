import { cookies } from 'next/headers'

const COOKIE = 'vendor_token'

export async function businessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

export async function setBusinessSession(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearBusinessSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}
