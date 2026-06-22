import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { DashboardCharts } from './DashboardCharts'

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
  const m = await apiFetch<Metrics>('/super-admin/metrics', token)

  const statCards = [
    { label: 'Vendors', value: m.totalVendors.toLocaleString(), sub: 'active on platform', color: 'bg-indigo-50 text-indigo-700' },
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
