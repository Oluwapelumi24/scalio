import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { VendorTabs } from '../VendorTabs'
import { BookingActions } from './BookingActions'

interface Booking {
  id: string; status: string; scheduledAt: string; durationMinutes: number
  paymentMode: string; totalAmountKobo: number
  customer: { id: string; name: string; email: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled_by_customer: 'bg-red-100 text-red-700',
  cancelled_by_vendor: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

const STATUS_TABS = ['', 'confirmed', 'pending_payment', 'completed', 'cancelled_by_vendor', 'no_show']

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function VendorBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendorId: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { vendorId } = await params
  const { status } = await searchParams
  const token = await requireToken()
  const qs = status ? `?status=${status}` : ''
  const bookings = await apiFetch<Booking[]>(`/super-admin/vendors/${vendorId}/bookings${qs}`, token)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>
      <VendorTabs vendorId={vendorId} />

      <div className="mt-6 flex gap-2 mb-4 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <a key={s} href={s ? `?status=${s}` : '?'}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${status === s || (!status && !s) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s ? statusLabel(s) : 'All'}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bookings.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-700">{b.customer?.name ?? 'Unknown'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(b.scheduledAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel(b.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <BookingActions vendorId={vendorId} bookingId={b.id} status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
