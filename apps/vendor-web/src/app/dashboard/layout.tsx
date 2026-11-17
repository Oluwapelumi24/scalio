import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
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
  const unread = await apiFetch<{ unread: number }>('/vendor-admin/notifications/unread-count', token)
    .then((row) => row.unread)
    .catch(() => 0)

  return (
    <DashboardChrome name={staff.name} role={staff.role} initials={initials} unread={unread} logout={logoutAction}>
      {children}
    </DashboardChrome>
  )
}
