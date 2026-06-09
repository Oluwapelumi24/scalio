import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { CreateStaffForm } from './StaffForm'
import { DeleteStaffButton } from './DeleteStaffButton'

interface StaffMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  hasActivatedAccount: boolean
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front Desk',
}

export default async function StaffPage() {
  const token = await requireToken()

  let staffList: StaffMember[] = []
  try {
    staffList = await apiFetch<StaffMember[]>('/vendor-admin/staff', token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff</h1>

      {staffList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-6">
          <p className="text-gray-400 text-sm">No staff members yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[s.role] ?? s.role}</td>
                  <td className="px-4 py-3">
                    {s.email ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.hasActivatedAccount
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {s.hasActivatedAccount ? 'Active' : 'Invite pending'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No portal access</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteStaffButton staffId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Add a staff member</h2>
        <p className="text-xs text-gray-500 mb-4">
          Staff with an email address will receive an invite link to set their password.
        </p>
        <CreateStaffForm />
      </div>
    </div>
  )
}
