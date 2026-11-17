import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import type { VendorProfile } from '@/lib/categories'
import { DashboardChrome } from './DashboardChrome'

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

  return (
    <DashboardChrome name={staff.name} role={staff.role} initials={initials} unread={unread} logout={logoutAction}>
      {profile?.approvalStatus === 'pending_review' ? (
        <p className="border-b border-[#fde8d8] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412] md:px-8">
          We’re reviewing {profile.businessName}. Set up services and hours now. Customers can find and book you after approval.
        </p>
      ) : profile?.approvalStatus === 'rejected' ? (
        <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 md:px-8">
          {profile.reviewNote || `${profile.businessName} wasn’t approved.`} Update the listing and we’ll look again.
        </p>
      ) : null}
      {children}
    </DashboardChrome>
  )
}
