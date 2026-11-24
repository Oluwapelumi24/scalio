import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import { AccountMenu } from './AccountMenu'
import { SidebarNav } from './SidebarNav'

interface AdminPrincipal {
  adminId: string
  name: string
  email: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken()
  if (!token) redirect('/login')

  let admin: AdminPrincipal
  try {
    admin = await apiFetch<AdminPrincipal>('/admin-auth/me', token)
  } catch {
    redirect('/login')
  }

  const pending = await apiFetch<{ id: string }[]>('/super-admin/vendors/pending', token).catch(() => null)

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <img src="/brand/lockup-reversed.svg" alt="Veno" className="h-7 w-auto" />
          <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
        </div>

        <SidebarNav pendingReviews={pending?.length ?? 0} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-8">
          <AccountMenu name={admin.name} email={admin.email} logout={logoutAction} />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
