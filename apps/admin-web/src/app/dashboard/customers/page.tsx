import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

interface GlobalCustomer {
  id: string; name: string; email: string | null; phone: string | null
  visitCount: number; lastVisitAt: string | null; vendorId: string; vendorName: string
}

export default async function GlobalCustomersPage() {
  const token = await requireToken()
  const customers = await apiFetch<GlobalCustomer[]>('/super-admin/customers', token)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Customers</h1>
        <p className="text-sm text-gray-500 mt-1">{customers.length} customers across all vendors</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Visits</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No customers yet.</td></tr>}
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.vendorName}</td>
                <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.visitCount}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('en-NG') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
