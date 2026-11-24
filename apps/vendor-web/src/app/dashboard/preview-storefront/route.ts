import { listingIsPublic } from '@veno/shared-types'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { WEBSITE_URL } from '@/lib/site'

/**
 * Opens the public booking page for this business. Approved listings go
 * straight there; businesses still in review get a short-lived preview token
 * so the page loads without becoming publicly discoverable.
 */
export async function GET() {
  const token = await getToken()
  if (!token) redirect('/login')

  let preview: { slug: string; token: string; approvalStatus: string }
  try {
    preview = await apiFetch('/vendor-admin/profile/preview', token, { method: 'POST' })
  } catch {
    redirect('/dashboard')
  }

  const base = WEBSITE_URL.replace(/\/$/, '')
  if (listingIsPublic(preview.approvalStatus)) {
    redirect(`${base}/book/${encodeURIComponent(preview.slug)}`)
  }
  redirect(
    `${base}/book/${encodeURIComponent(preview.slug)}?preview=${encodeURIComponent(preview.token)}`,
  )
}
