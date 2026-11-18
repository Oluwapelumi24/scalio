/**
 * Where the signed-in business dashboard lives. Prefer a server-only
 * VENDOR_WEB_URL so production can open the dashboard without also redirecting
 * /register and /login off this site (those still use NEXT_PUBLIC_VENDOR_WEB_URL).
 * app.venohq.com is unpublished and must never be used.
 */
export function dashboardPortalUrl(): string {
  const raw = (
    process.env.VENDOR_WEB_URL ||
    process.env.NEXT_PUBLIC_VENDOR_WEB_URL ||
    ''
  ).replace(/\/$/, '')

  if (!raw) {
    return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'
  }

  try {
    if (new URL(raw).hostname === 'app.venohq.com') return ''
  } catch {
    return ''
  }

  return raw.startsWith('http') ? raw : ''
}

export function dashboardPortalLinked(): boolean {
  return dashboardPortalUrl().startsWith('http')
}
