import { redirect } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { getToken } from '@/lib/session'

interface StaffPrincipal { role: string; name: string }
interface Metrics {
  totalBookings: number
  bookingsByStatus: Record<string, number>
  upcomingCount: number
  revenueLast30DaysKobo: number
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export default async function DashboardHome() {
  const token = await getToken()
  if (!token) redirect('/login')

  let staff: StaffPrincipal
  try {
    staff = await apiFetch<StaffPrincipal>('/vendor-auth/me', token)
  } catch {
    redirect('/login')
  }

  if (staff.role === 'practitioner' || staff.role === 'front_desk') {
    redirect('/dashboard/bookings')
  }

  let metrics: Metrics | null = null
  try {
    metrics = await apiFetch<Metrics>('/vendor-admin/metrics', token)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
  }

  const statCards = metrics
    ? [
        { label: 'Total bookings', value: metrics.totalBookings.toLocaleString() },
        { label: 'Upcoming', value: metrics.upcomingCount.toLocaleString() },
        { label: 'Revenue (last 30d)', value: formatNaira(metrics.revenueLast30DaysKobo) },
        { label: 'No-shows', value: (metrics.bookingsByStatus['no_show'] ?? 0).toLocaleString() },
      ]
    : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {staff.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s a snapshot of your business</p>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Bookings by status</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(metrics.bookingsByStatus).map(([status, total]) => (
                <div key={status} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-gray-900">{Number(total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
