import { bookingIsCancelled } from '@veno/shared-types'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { EmptyCalendar } from '../home/visuals'
import { EmptyState } from '../EmptyState'
import { BookingActions } from './BookingActions'
import { DayCalendar, todayIso } from './DayCalendar'

interface Booking {
  id: string
  status: string
  scheduledAt: string
  durationMinutes: number
  paymentMode: string
  totalAmountKobo: number | null
  notes: string | null
  customer: { id: string; name: string; email: string | null } | null
  staff: { id: string; name: string } | null
  services: { id: string; name: string; priceKobo: number }[]
}

interface TodaySummary {
  bookings: number
  upcoming: number
  awaitingPayment: number
  salesKobo: number | null
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
]

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled_by_customer: 'bg-red-100 text-red-700',
  cancelled_by_vendor: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled by customer',
  cancelled_by_vendor: 'Cancelled by you',
  no_show: 'No show',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(kobo: number | null | undefined) {
  if (kobo == null) return '—'
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function formatPaymentMode(mode: string) {
  return { pay_on_arrival: 'On arrival', deposit: 'Deposit', full_prepayment: 'Prepaid' }[mode] ?? mode
}

function serviceLabel(booking: Booking) {
  if (!booking.services.length) return 'Service'
  if (booking.services.length === 1) return booking.services[0].name
  return `${booking.services[0].name} +${booking.services.length - 1}`
}

function sameDay(iso: string, day: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}` === day
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; date?: string }>
}) {
  const params = await searchParams
  const status = params.status ?? ''
  const cancelledTab = status === 'cancelled'
  const view = params.view === 'list' ? 'list' : 'calendar'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : todayIso()
  const token = await requireToken()

  const [today, staff] = await Promise.all([
    apiFetch<TodaySummary>('/vendor-admin/bookings/summary', token).catch(() => null),
    apiFetch<{ id: string; name: string }[]>('/vendor-admin/staff', token).catch(() => [] as { id: string; name: string }[]),
  ])

  let bookings: Booking[] = []
  try {
    const url = status && !cancelledTab ? `/vendor-admin/bookings?status=${status}` : '/vendor-admin/bookings'
    bookings = await apiFetch<Booking[]>(url, token)
    if (cancelledTab) bookings = bookings.filter((b) => bookingIsCancelled(b.status))
  } catch {
    /* show empty state */
  }

  const dayBookings = bookings.filter(
    (b) => sameDay(b.scheduledAt, date) && !bookingIsCancelled(b.status),
  )

  const stats = [
    { label: "Today's bookings", value: String(today?.bookings ?? 0), href: null as string | null },
    { label: 'Upcoming', value: String(today?.upcoming ?? 0), href: '/dashboard/bookings?view=list&status=confirmed' },
    { label: 'Awaiting payment', value: String(today?.awaitingPayment ?? 0), href: '/dashboard/bookings?view=list&status=pending_payment' },
    ...(today?.salesKobo != null
      ? [{ label: "Today's sales", value: formatMoney(today.salesKobo), href: null as string | null }]
      : []),
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-[#4a4e57]">Who is coming in, by staff and time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-[#f0f1f4] p-1">
            <Link
              href={date === todayIso() ? '/dashboard/bookings' : `/dashboard/bookings?date=${date}`}
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold ${
                view === 'calendar' ? 'bg-white text-[#0a0a0a]' : 'text-[#7d818b]'
              }`}
            >
              Day
            </Link>
            <Link
              href="/dashboard/bookings?view=list"
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold ${
                view === 'list' ? 'bg-white text-[#0a0a0a]' : 'text-[#7d818b]'
              }`}
            >
              List
            </Link>
          </div>
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
          >
            New booking
          </Link>
        </div>
      </div>

      <div className={`mb-6 grid overflow-hidden rounded-[20px] bg-white divide-x divide-[#e4e6eb] ${stats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
        {stats.map((stat) => {
          const inner = (
            <>
              <p className="truncate text-xl font-bold leading-none text-gray-900 tabular-nums">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </>
          )
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block px-4 py-4 hover:bg-[#fafbfc]">
              {inner}
            </Link>
          ) : (
            <div key={stat.label} className="px-4 py-4">
              {inner}
            </div>
          )
        })}
      </div>

      {view === 'calendar' ? (
        dayBookings.length === 0 && bookings.length === 0 ? (
          <EmptyState
            art={<EmptyCalendar className="h-20 w-20" />}
            title="No bookings yet"
            body="When customers book — or you add a walk-in — they show up on the day board."
            action={
              <Link
                href="/dashboard/bookings/new"
                className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
              >
                New booking
              </Link>
            }
          />
        ) : (
          <DayCalendar date={date} staff={staff} bookings={dayBookings} />
        )
      ) : (
        <>
          <div className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            <div className="flex w-max gap-1 rounded-lg bg-gray-100 p-1">
              {STATUS_TABS.map(({ value, label }) => (
                <Link
                  key={value}
                  href={value ? `/dashboard/bookings?view=list&status=${value}` : '/dashboard/bookings?view=list'}
                  className={`inline-flex h-12 items-center rounded-[20px] px-3 text-sm font-medium transition-colors ${
                    status === value ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              art={<EmptyCalendar className="h-20 w-20" />}
              title={status ? 'No bookings with this status' : 'No bookings yet'}
              body={
                status
                  ? 'Try another filter, or book a walk-in for someone who just arrived.'
                  : 'When customers book — or you add a walk-in — they show up here with time, service, and payment.'
              }
              action={
                <Link
                  href="/dashboard/bookings/new"
                  className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white"
                >
                  New booking
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-[20px] bg-white">
              <table className="w-full min-w-[48rem] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">When</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Staff</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{b.customer?.name ?? 'Walk-in'}</p>
                        <p className="text-xs text-gray-500">{formatPaymentMode(b.paymentMode)} · {b.durationMinutes} min</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{serviceLabel(b)}</td>
                      <td className="px-4 py-3 text-gray-900">{formatDate(b.scheduledAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{b.staff?.name ?? 'Unassigned'}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-gray-900">{formatMoney(b.totalAmountKobo)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_LABEL[b.status] ?? b.status.replaceAll('_', ' ')}
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
        </>
      )}
    </div>
  )
}
