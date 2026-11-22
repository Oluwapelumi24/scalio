import Link from 'next/link'
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

  // Today's figures sit above the filters and don't change with them.
  const today = await apiFetch<{ bookings: number; salesKobo: number | null }>('/vendor-admin/bookings/summary', token).catch(() => null)

  let bookings: Booking[] = []
  try {
    const url = status ? `/vendor-admin/bookings?status=${status}` : '/vendor-admin/bookings'
    bookings = await apiFetch<Booking[]>(url, token)
  } catch {
    /* show empty state */
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
        >
          New booking
        </Link>
      </div>

      {today && (
        <div className={`mb-6 grid overflow-hidden rounded-xl border border-gray-200 bg-white divide-x divide-gray-200 ${today.salesKobo != null ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="px-4 py-4">
            <p className="text-xl font-bold leading-none text-gray-900 tabular-nums">{today.bookings}</p>
            <p className="mt-1 text-sm text-gray-500">Today&apos;s bookings</p>
          </div>
          {today.salesKobo != null && (
            <div className="min-w-0 px-4 py-4">
              <p className="truncate text-xl font-bold leading-none text-gray-900 tabular-nums">₦{(today.salesKobo / 100).toLocaleString('en-NG')}</p>
              <p className="mt-1 text-sm text-gray-500">Today&apos;s sales</p>
            </div>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <div className="flex w-max gap-1 rounded-lg bg-gray-100 p-1">
        {STATUS_TABS.map(({ value, label }) => (
          <a
            key={value}
            href={value ? `/dashboard/bookings?status=${value}` : '/dashboard/bookings'}
            className={`inline-flex h-12 items-center rounded-[20px] px-3 text-sm font-medium transition-colors ${
              status === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </a>
        ))}
      </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm font-medium text-gray-700">
            {status ? 'No bookings with this status' : 'No bookings yet'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {status
              ? 'Try another filter, or book a walk-in for someone who just arrived.'
              : 'When customers book — or you add a walk-in — they’ll show up here.'}
          </p>
          <Link
            href="/dashboard/bookings/new"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
          >
            New booking
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
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
