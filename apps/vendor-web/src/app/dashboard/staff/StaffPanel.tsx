import Link from 'next/link'
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

export async function StaffPanel() {
  const token = await requireToken()

  let staffList: StaffMember[] = []
  try {
    staffList = await apiFetch<StaffMember[]>('/vendor-admin/staff', token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#e4e6eb] bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0a0a0a]">Attendance</p>
          <p className="text-[13px] text-[#7d818b]">Clock in and out for the team — same records on mobile.</p>
        </div>
        <Link
          href="/dashboard/attendance"
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#e8edfa] px-3.5 text-sm font-semibold text-[#1e3a8a]"
        >
          Open attendance
        </Link>
      </div>

      {staffList.length === 0 ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-400">No staff members yet.</p>
        </div>
      ) : (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
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

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Add a staff member</h2>
        <p className="mb-4 text-xs text-gray-500">
          Staff with an email address will receive an invite link to set their password.
        </p>
        <CreateStaffForm />
      </div>
    </div>
  )
}
