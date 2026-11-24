import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { DashboardCharts } from './DashboardCharts'

interface PendingVendor {
  id: string
  businessName: string
  category: string
  ownerName: string | null
  ownerEmail: string | null
  createdAt: string
}

interface Metrics {
  totalVendors: number
  totalBookings: number
  totalCustomers: number
  totalRevenueKobo: number
  bookingsByStatus: Record<string, number>
  revenueByVendor: Array<{
    vendorId: string
    businessName: string
    totalRevenueKobo: string | null
    totalBookings: number
  }>
  bookingsTrend: Array<{ day: string; total: number }>
}

function formatNaira(kobo: number) {
  const amount = kobo / 100
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`
  return `₦${amount.toLocaleString('en-NG')}`
}

export default async function DashboardPage() {
  const token = await requireToken()
  const [m, pending] = await Promise.all([
    apiFetch<Metrics>('/super-admin/metrics', token),
    apiFetch<PendingVendor[]>('/super-admin/vendors/pending', token),
  ])
  const waiting = pending.slice(0, 5)
  const hidden = pending.length - waiting.length

  const statCards = [
    { label: 'Vendors', value: m.totalVendors.toLocaleString(), sub: 'on the platform', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Total Bookings', value: m.totalBookings.toLocaleString(), sub: 'all time', color: 'bg-blue-50 text-blue-700' },
    { label: 'Customers', value: m.totalCustomers.toLocaleString(), sub: 'across all vendors', color: 'bg-violet-50 text-violet-700' },
    { label: 'Revenue', value: formatNaira(m.totalRevenueKobo), sub: 'completed bookings', color: 'bg-emerald-50 text-emerald-700' },
  ]

  // Completion rate ring data
  const completed = Number(m.bookingsByStatus['completed'] ?? 0)
  const total = m.totalBookings || 1
  const completionRate = Math.round((completed / total) * 100)
  const noShowRate = Math.round((Number(m.bookingsByStatus['no_show'] ?? 0) / total) * 100)
  const cancellationRate = Math.round(
    ((Number(m.bookingsByStatus['cancelled_by_customer'] ?? 0) + Number(m.bookingsByStatus['cancelled_by_vendor'] ?? 0)) / total) * 100
  )

  const ringData = [
    { label: 'Completion rate', value: completionRate, color: '#10b981' },
    { label: 'No-show rate', value: noShowRate, color: '#f59e0b' },
    { label: 'Cancellation rate', value: cancellationRate, color: '#ef4444' },
  ]

  const pieData = Object.entries(m.bookingsByStatus)
    .filter(([, v]) => Number(v) > 0)
    .map(([status, count]) => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: Number(count),
    }))

  const revenueRings = m.revenueByVendor.slice(0, 5).map((v) => ({
    name: v.businessName,
    revenue: Number(v.totalRevenueKobo ?? 0),
    bookings: v.totalBookings,
  }))

  const maxRevenue = Math.max(...revenueRings.map((r) => r.revenue), 1)

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide performance overview</p>
      </div>

      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pending vendor requests</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {pending.length === 0
                ? 'No businesses waiting for review'
                : `${pending.length} ${pending.length === 1 ? 'business is' : 'businesses are'} waiting for review`}
            </p>
          </div>
          {pending.length > 0 ? (
            <Link
              href="/dashboard/vendors/reviews"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-amber-50 px-4 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Review all
            </Link>
          ) : null}
        </div>
        {waiting.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">New applications will show up here.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {waiting.map((vendor) => (
              <li key={vendor.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                  {vendor.businessName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{vendor.businessName}</p>
                  <p className="truncate text-sm text-gray-500">
                    {vendor.category}
                    {vendor.ownerName ? ` · ${vendor.ownerName}` : vendor.ownerEmail ? ` · ${vendor.ownerEmail}` : ''}
                  </p>
                </div>
                <p className="hidden shrink-0 text-xs text-gray-400 sm:block">
                  {new Date(vendor.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <Link
                  href={`/dashboard/vendors/reviews#${vendor.id}`}
                  className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 ? (
          <p className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            <Link href="/dashboard/vendors/reviews" className="font-medium text-indigo-600 hover:text-indigo-800">
              {hidden} more in the queue
            </Link>
          </p>
        ) : null}
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-2 ${color.split(' ')[1]}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <DashboardCharts
        pieData={pieData}
        ringData={ringData}
        revenueRings={revenueRings}
        maxRevenue={maxRevenue}
        bookingsTrend={m.bookingsTrend}
      />
    </div>
  )
}
