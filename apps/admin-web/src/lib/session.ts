import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'admin_token'

export async function getToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

export async function requireToken(): Promise<string> {
  const token = await getToken()
  if (!token) redirect('/login')
  return token
}

export async function setToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearToken(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}
