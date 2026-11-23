import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { EmptyClients } from '../home/visuals'
import { EmptyState } from '../EmptyState'

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-[#4a4e57]">People who have booked you — contact details and last visit.</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          art={<EmptyClients className="h-20 w-20" />}
          title="No clients yet"
          body="They appear automatically after their first booking — or book a walk-in yourself."
          action={
            <Link
              href="/dashboard/bookings/new"
              className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
            >
              Book a walk-in
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-[#e4e6eb] bg-white">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last visit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.lastVisitAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="text-xs font-medium text-[#1e3a8a] hover:underline"
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
