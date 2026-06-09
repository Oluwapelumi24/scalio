import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { BookingActions } from './BookingActions'

interface Booking {
  id: string
  status: string
  scheduledAt: string
  durationMinutes: number
  paymentMode: string
  notes: string | null
  customerId: string
  serviceId: string
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPaymentMode(mode: string) {
  return { pay_on_arrival: 'On Arrival', deposit: 'Deposit', full_prepayment: 'Full' }[mode] ?? mode
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = '' } = await searchParams
  const token = await requireToken()

  let bookings: Booking[] = []
  try {
    const url = status ? `/vendor-admin/bookings?status=${status}` : '/vendor-admin/bookings'
    bookings = await apiFetch<Booking[]>(url, token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(({ value, label }) => (
          <a
            key={value}
            href={value ? `/dashboard/bookings?status=${value}` : '/dashboard/bookings'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {b.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{formatDate(b.scheduledAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{b.durationMinutes} min</td>
                  <td className="px-4 py-3 text-gray-600">{formatPaymentMode(b.paymentMode)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <BookingActions bookingId={b.id} status={b.status} />
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
