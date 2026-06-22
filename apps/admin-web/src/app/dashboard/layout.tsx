import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
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

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <p className="text-white font-bold text-lg">Scalio</p>
          <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
        </div>

        <SidebarNav />

        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-white text-sm font-medium truncate">{admin.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">Operations Manager</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs text-slate-400 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
