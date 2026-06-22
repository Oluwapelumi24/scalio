import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { InviteAdminForm } from './InviteAdminForm'
import { RemoveAdminButton } from './RemoveAdminButton'

interface AdminMember {
  id: string
  name: string
  email: string
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

export default async function TeamPage() {
  const token = await requireToken()
  const members = await apiFetch<AdminMember[]>('/super-admin/team', token)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Operations managers with portal access</p>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last login</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No team members yet.</td></tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">
                  {m.active
                    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                    : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Invite pending</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {m.lastLoginAt
                    ? new Date(m.lastLoginAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'
                  }
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(m.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <RemoveAdminButton adminId={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Invite team member</h2>
        <p className="text-xs text-gray-400 mb-4">They&apos;ll receive an email with a link to set their password.</p>
        <InviteAdminForm />
      </div>
    </div>
  )
}
