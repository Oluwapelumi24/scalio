import type { NextRequest } from 'next/server'
import { getToken } from '@/lib/session'

const BASE = process.env.API_URL ?? 'http://localhost:3000'

/** Content studio photos are behind sign-in on the API; this passes the session along so <img> can show them. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const token = await getToken()
  if (!token) return new Response('Not signed in', { status: 401 })
  const res = await fetch(`${BASE}/vendor-admin/content/media/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return new Response('Not found', { status: res.status === 401 ? 401 : 404 })
  return new Response(res.body, {
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg', 'Cache-Control': 'private, max-age=86400' },
  })
}
