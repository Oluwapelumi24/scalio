import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES } from '@/lib/personalisation'
import type { ShiftRecord, TeamShiftStatus } from '@/lib/staff'
import { ClockButton } from './ClockButton'

interface Me { staffId: string; role: string; name: string }

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })

function duration(from: string, to: string | null) {
  const mins = Math.round(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / 60000)
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

export default async function AttendancePage() {
  const token = await requireToken()
  const me = await apiFetch<Me>('/vendor-auth/me', token)
  const isManager = MANAGER_ROLES.includes(me.role)

  const [mine, team, shifts] = await Promise.all([
    apiFetch<{ clockedIn: boolean; since: string | null }>('/vendor-admin/attendance/me', token),
    isManager ? apiFetch<TeamShiftStatus[]>('/vendor-admin/attendance/team', token) : Promise.resolve([]),
    apiFetch<ShiftRecord[]>(`/vendor-admin/attendance?from=${isoDaysAgo(6)}&to=${isoDaysAgo(0)}`, token),
  ])
  const others = team.filter((t) => t.id !== me.staffId)

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Clock in when you start work and out when you finish. Mobile and web share the same records.</p>
      </div>

      <section className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${mine.clockedIn ? 'bg-emerald-500' : 'bg-gray-300'}`} aria-hidden />
          <p className="font-medium text-gray-900">
            {mine.clockedIn && mine.since ? `You're clocked in since ${fmtTime(mine.since)}` : "You're not clocked in"}
          </p>
        </div>
        <ClockButton clockedIn={mine.clockedIn} large />
      </section>

      {isManager && others.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900">Your team now</h2>
          <p className="text-sm text-gray-500 mb-3">You can clock someone in or out if they forget.</p>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {others.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${m.clockedIn ? 'bg-emerald-500' : 'bg-gray-300'}`} aria-hidden />
                  <span className="font-medium text-gray-900">{m.name}</span>
                  <span className="text-gray-500">{m.clockedIn && m.since ? `since ${fmtTime(m.since)}` : 'not clocked in'}</span>
                </span>
                <ClockButton clockedIn={m.clockedIn} staffId={m.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Last 7 days</h2>
        {shifts.length === 0 ? (
          <p className="text-sm text-gray-500">No shifts recorded yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Person</th>
                  <th className="px-4 py-2 text-left font-semibold">Day</th>
                  <th className="px-4 py-2 text-left font-semibold">In</th>
                  <th className="px-4 py-2 text-left font-semibold">Out</th>
                  <th className="px-4 py-2 text-left font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {s.staffName}
                      {s.source === 'manager' && <span className="ml-2 text-xs text-gray-400">by manager</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{fmtDay(s.clockInAt)}</td>
                    <td className="px-4 py-2 text-gray-600">{fmtTime(s.clockInAt)}</td>
                    <td className="px-4 py-2 text-gray-600">{s.clockOutAt ? fmtTime(s.clockOutAt) : <span className="text-emerald-600">On shift</span>}</td>
                    <td className="px-4 py-2 text-gray-600">{duration(s.clockInAt, s.clockOutAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
