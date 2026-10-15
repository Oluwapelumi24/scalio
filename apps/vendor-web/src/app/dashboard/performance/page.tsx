import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { formatNaira, type PerformanceReport } from '@/lib/staff'

const PERIODS = [7, 30, 90]

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`)
const hours = (m: number) => `${Math.round((m / 60) * 10) / 10}h`

const LABELS: Record<string, string> = {
  sales: 'Sales',
  completed: 'Completed',
  completionRate: 'Completion rate',
  uniqueCustomers: 'Customers',
  repeatCustomers: 'Repeat customers',
  attendance: 'Attendance',
  feedback: 'Customer feedback',
}

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'front_desk') redirect('/dashboard')

  const days = PERIODS.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30
  const report = await apiFetch<PerformanceReport>(
    `/vendor-admin/performance?from=${isoDaysAgo(days - 1)}&to=${isoDaysAgo(0)}`,
    token,
  )

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff performance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {report.from} to {report.to}. People work different hours and see different customers — compare with care. There&apos;s no single score.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((d) => (
            <Link
              key={d}
              href={`/dashboard/performance?days=${d}`}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${d === days ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
            >
              {d} days
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Person</th>
              <th className="px-4 py-3 text-right font-semibold">Sales</th>
              <th className="px-4 py-3 text-right font-semibold">Completed</th>
              <th className="px-4 py-3 text-right font-semibold">No-shows</th>
              <th className="px-4 py-3 text-right font-semibold">Completion rate</th>
              <th className="px-4 py-3 text-right font-semibold">Repeat customers</th>
              {report.tracksAttendance && <th className="px-4 py-3 text-right font-semibold">Attendance</th>}
              <th className="px-4 py-3 text-right font-semibold">Still to come</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {report.staff.map((p) => (
              <tr key={p.staffId ?? 'unassigned'} className={p.staffId ? 'text-gray-900' : 'text-gray-500'}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {p.staffId ? <Link href={`/dashboard/staff/${p.staffId}`} className="hover:text-indigo-600">{p.name}</Link> : p.name}
                  {p.attendance?.clockedInNow && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">On shift</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatNaira(p.salesKobo)}
                  {p.averageSaleKobo != null && <span className="block text-xs text-gray-400">avg {formatNaira(p.averageSaleKobo)}</span>}
                </td>
                <td className="px-4 py-3 text-right">{p.completed}</td>
                <td className="px-4 py-3 text-right">{p.noShows}</td>
                <td className="px-4 py-3 text-right">{pct(p.completionRate)}</td>
                <td className="px-4 py-3 text-right">{p.repeatCustomers} of {p.uniqueCustomers}</td>
                {report.tracksAttendance && (
                  <td className="px-4 py-3 text-right">
                    {p.attendance ? (
                      p.attendance.scheduledMinutes ? (
                        <>
                          {pct(p.attendance.rate)}
                          <span className="block text-xs text-gray-400">{hours(p.attendance.workedMinutes)} of {hours(p.attendance.scheduledMinutes)}</span>
                        </>
                      ) : (
                        <>
                          {hours(p.attendance.workedMinutes)}
                          <span className="block text-xs text-gray-400">
                            {p.attendance.scheduledMinutes === null ? 'no weekly hours set' : 'nothing scheduled yet'}
                          </span>
                        </>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-right">{p.upcoming}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!report.tracksAttendance && (
        <p className="text-sm text-gray-500">Attendance appears here once your team starts clocking in.</p>
      )}

      <details className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-indigo-600">How these are calculated</summary>
        <dl className="mt-3 space-y-3 text-sm">
          {Object.entries(report.definitions).map(([key, text]) => (
            <div key={key}>
              <dt className="font-semibold text-gray-900">{LABELS[key] ?? key}</dt>
              <dd className="text-gray-600">{text}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
