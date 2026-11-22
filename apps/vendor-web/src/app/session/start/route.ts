import { NextRequest, NextResponse } from 'next/server'
import { ApiError, apiFetch } from '@/lib/api'

interface VendorSession {
  accessToken: string
}

const COOKIE = 'vendor_token'

/**
 * Receives a one-time handoff code from the marketing site, stores the session
 * cookie on this origin, and opens the dashboard.
 *
 * Redirects use relative Location paths on purpose. On Railway, request.url is
 * the container bind address (0.0.0.0:8080); an absolute redirect there sends
 * the browser to a non-routable host. A relative /dashboard resolves against
 * the public URL the browser already used.
 */
export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') ?? '').trim().toLowerCase()

  if (!/^[0-9a-f]{32,64}$/.test(code)) {
    return relativeRedirect('/login')
  }

  let accessToken: string
  try {
    const session = await apiFetch<VendorSession>('/vendor-auth/handoff/exchange', null, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    accessToken = session.accessToken
  } catch (err) {
    if (err instanceof ApiError) return relativeRedirect('/login')
    throw err
  }

  const response = relativeRedirect('/dashboard')
  response.cookies.set(COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}

function relativeRedirect(path: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: path },
  })
}
