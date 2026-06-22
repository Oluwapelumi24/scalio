import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { VendorTabs } from '../VendorTabs'
import { StaffActions } from './StaffActions'
import { AddStaffForm } from './AddStaffForm'

interface StaffMember {
  id: string; name: string; email: string | null; role: string; hasActivatedAccount: boolean
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', manager: 'Manager', practitioner: 'Practitioner', front_desk: 'Front Desk',
}

export default async function VendorStaffPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const token = await requireToken()
  const staffList = await apiFetch<StaffMember[]>(`/super-admin/vendors/${vendorId}/staff`, token)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff</h1>
      <VendorTabs vendorId={vendorId} />

      <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffList.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No staff yet.</td></tr>}
            {staffList.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[s.role] ?? s.role}</td>
                <td className="px-4 py-3">
                  {s.hasActivatedAccount
                    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                    : s.email
                      ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Invite pending</span>
                      : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No access</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <StaffActions vendorId={vendorId} staffId={s.id} name={s.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add staff member</h2>
        <AddStaffForm vendorId={vendorId} />
      </div>
    </div>
  )
}
