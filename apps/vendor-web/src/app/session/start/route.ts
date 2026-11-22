import { NextRequest, NextResponse } from 'next/server'
import { ApiError, apiFetch } from '@/lib/api'
import { publicOrigin } from '@/lib/public-origin'

interface VendorSession {
  accessToken: string
}

const COOKIE = 'vendor_token'

/**
 * Receives a one-time handoff code from the marketing site, stores the session
 * cookie on this origin, and opens the dashboard.
 */
export async function GET(request: NextRequest) {
  const origin = publicOrigin(request)
  const code = (request.nextUrl.searchParams.get('code') ?? '').trim().toLowerCase()
  const login = `${origin}/login`

  if (!/^[0-9a-f]{32,64}$/.test(code)) {
    return NextResponse.redirect(login)
  }

  let accessToken: string
  try {
    const session = await apiFetch<VendorSession>('/vendor-auth/handoff/exchange', null, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    accessToken = session.accessToken
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.redirect(login)
    throw err
  }

  const response = NextResponse.redirect(`${origin}/dashboard`)
  response.cookies.set(COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
