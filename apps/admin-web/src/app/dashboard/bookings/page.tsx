import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'

interface GlobalBooking {
  id: string; status: string; scheduledAt: string; paymentMode: string
  amountDueKobo: number; vendorId: string; vendorName: string
}

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled_by_customer: 'bg-red-100 text-red-700',
  cancelled_by_vendor: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

export default async function GlobalBookingsPage({ searchParams }: { searchParams: Promise<{ vendorId?: string; status?: string }> }) {
  const { vendorId, status } = await searchParams
  const token = await requireToken()
  const qs = new URLSearchParams()
  if (vendorId) qs.set('vendorId', vendorId)
  if (status) qs.set('status', status)
  const bookings = await apiFetch<GlobalBooking[]>(`/super-admin/bookings?${qs}`, token)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-vendor booking overview</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bookings found.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-700">{b.vendorName}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(b.scheduledAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-gray-600">₦{(b.amountDueKobo / 100).toLocaleString('en-NG')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
