import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { getToken } from '@/lib/session'
import { logoutAction } from '@/app/actions/auth'
import { SidebarNav } from './SidebarNav'

interface StaffPrincipal {
  staffId: string
  vendorId: string
  name: string
  email: string | null
  role: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front Desk',
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <p className="text-white font-bold text-lg">Scalio</p>
          <p className="text-slate-400 text-xs mt-0.5">Vendor Portal</p>
        </div>

        <SidebarNav role={staff.role} />

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-white text-sm font-medium truncate">{staff.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">{ROLE_LABELS[staff.role] ?? staff.role}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
