import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import type { VendorProfile } from '@/lib/categories'
import { WEBSITE_URL } from '@/lib/site'
import { DashboardChrome } from './DashboardChrome'
import { PendingReviewCopy, RejectedReviewCopy, ReviewBanner } from './ReviewBanner'

interface StaffPrincipal {
  staffId: string
  vendorId: string
  name: string
  email: string | null
  role: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken()
  if (!token) redirect('/login')

  let staff: StaffPrincipal
  try {
    staff = await apiFetch<StaffPrincipal>('/vendor-auth/me', token)
  } catch {
    redirect('/login')
  }

  const initials = staff.name.slice(0, 2).toUpperCase()
  const profile = await apiFetch<VendorProfile>('/vendor-admin/profile', token).catch(() => null)
  const unread = await apiFetch<{ unread: number }>('/vendor-admin/notifications/unread-count', token)
    .then((row) => row.unread)
    .catch(() => 0)

  const banner =
    profile?.approvalStatus === 'pending_review' ? (
      <ReviewBanner tone="pending" storageKey={`veno-review-banner:pending:${profile.slug}`}>
        <PendingReviewCopy businessName={profile.businessName} />
      </ReviewBanner>
    ) : profile?.approvalStatus === 'rejected' ? (
      <ReviewBanner tone="rejected" storageKey={`veno-review-banner:rejected:${profile.slug}`}>
        <RejectedReviewCopy note={profile.reviewNote} businessName={profile.businessName} />
      </ReviewBanner>
    ) : null

  const suiteUnlocked = profile?.approvalStatus === 'approved'

  return (
    <DashboardChrome
      name={staff.name}
      role={staff.role}
      initials={initials}
      unread={unread}
      logout={logoutAction}
      banner={banner}
      suiteUnlocked={suiteUnlocked}
      previewUrl={profile?.slug ? `${WEBSITE_URL.replace(/\/$/, '')}/book/${profile.slug}` : null}
    >
      {children}
    </DashboardChrome>
  )
}
