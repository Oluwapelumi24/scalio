import { STAFF_ACCOUNT_LABEL } from '@veno/shared-types'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { InviteAdminButton } from './InviteAdminForm'
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">Operations managers with portal access</p>
        </div>
        <InviteAdminButton />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Last login</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No team members yet. Use Add member to send an invite.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {m.active ? STAFF_ACCOUNT_LABEL.active : STAFF_ACCOUNT_LABEL.invite_pending}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {m.lastLoginAt
                    ? new Date(m.lastLoginAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <RemoveAdminButton adminId={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
