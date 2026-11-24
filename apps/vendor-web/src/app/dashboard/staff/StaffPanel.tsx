import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { ROLE_LABELS } from '@/lib/roles'
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

export async function StaffPanel() {
  const token = await requireToken()

  let staffList: StaffMember[] = []
  try {
    staffList = await apiFetch<StaffMember[]>('/vendor-admin/staff', token)
  } catch {
    /* show empty state */
  }

  return (
    <div className="space-y-4">
      {staffList.length === 0 ? (
        <div className="rounded-[20px] bg-white px-6 py-12 text-center">
          <p className="text-sm text-[#7d818b]">No staff members yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8fa]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/dashboard/staff/${s.id}`} className="hover:text-indigo-600">
                      {s.name}
                    </Link>
                  </td>
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
                      <span className="text-xs text-gray-400">No portal access</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/staff/${s.id}`}
                      className="mr-3 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Hours &amp; time off
                    </Link>
                    <DeleteStaffButton staffId={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-[20px] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Add a staff member</h2>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">
          Staff with an email address will receive an invite link to set their password.
        </p>
        <div className="mt-5">
          <CreateStaffForm />
        </div>
      </div>
    </div>
  )
}
