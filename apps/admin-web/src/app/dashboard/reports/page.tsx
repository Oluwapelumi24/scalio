import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { ExportButton } from './ExportButton'

interface RevenueReport {
  totalRevenueKobo: number
  totalBookings: number
  byVendor: Array<{
    vendorId: string
    businessName: string
    revenueKobo: string | null
    bookingCount: number
  }>
  statusBreakdown: Record<string, number>
}

function formatNaira(k: number) {
  return `₦${(k / 100).toLocaleString('en-NG')}`
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; vendorId?: string }>
}) {
  const { from, to, vendorId } = await searchParams
  const token = await requireToken()

  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  if (vendorId) qs.set('vendorId', vendorId)

  const report = await apiFetch<RevenueReport>(`/super-admin/reports/revenue?${qs}`, token)

  const periodLabel = from && to
    ? `${new Date(from).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(to).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'All time'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <ExportButton report={report} periodLabel={periodLabel} />
      </div>

      {/* Date filter */}
      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" name="from" defaultValue={from ?? ''}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" name="to" defaultValue={to ?? ''}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <button type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          Apply
        </button>
        {(from || to) && (
          <a href="/dashboard/reports" className="text-sm text-gray-400 hover:text-gray-600 py-2">Clear</a>
        )}
      </form>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue collected</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{formatNaira(report.totalRevenueKobo)}</p>
          <p className="text-xs text-gray-400 mt-1">Completed bookings only</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed bookings</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{report.totalBookings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">In selected period</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg. per booking</p>
          <p className="text-3xl font-bold text-gray-700 mt-2">
            {report.totalBookings > 0 ? formatNaira(Math.round(report.totalRevenueKobo / report.totalBookings)) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Revenue ÷ bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by vendor */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue by vendor</h2>
          {report.byVendor.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data for this period.</p>
          ) : (
            <div className="space-y-3">
              {report.byVendor.map((v) => {
                const rev = Number(v.revenueKobo ?? 0)
                const maxRev = Number(report.byVendor[0]?.revenueKobo ?? 1)
                const pct = maxRev > 0 ? Math.round((rev / maxRev) * 100) : 0
                return (
                  <div key={v.vendorId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1 mr-4">{v.businessName}</span>
                      <span className="text-gray-500 text-xs mr-3">{v.bookingCount} bookings</span>
                      <span className="font-semibold text-gray-900 shrink-0">{formatNaira(rev)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Booking status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Booking status breakdown</h2>
          {Object.keys(report.statusBreakdown).length === 0 ? (
            <p className="text-sm text-gray-400">No booking data for this period.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.statusBreakdown)
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([status, total]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gray-900">{Number(total).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
