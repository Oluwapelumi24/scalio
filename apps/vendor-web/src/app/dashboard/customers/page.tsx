import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  lastVisitAt: string | null
  notes: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CustomersPage() {
  const token = await requireToken()

  let customers: Customer[] = []
  try {
    customers = await apiFetch<Customer[]>('/vendor-admin/customers', token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clients</h1>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No clients yet</p>
          <p className="mt-1 text-sm text-gray-400">
            They appear automatically after their first booking — or book a walk-in yourself.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/bookings/new"
              className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
            >
              Book a walk-in
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold text-[#1e3a8a]">
              Go to home
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Visit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.lastVisitAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
