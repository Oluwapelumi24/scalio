import { LayoutDashboard, CalendarDays, Users, Scissors, Settings } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Bookings', icon: CalendarDays, active: false },
  { label: 'Services', icon: Scissors, active: false },
  { label: 'Staff', icon: Users, active: false },
  { label: 'Settings', icon: Settings, active: false },
]

const STATS = [
  { label: 'Bookings this week', value: '38' },
  { label: 'Completion rate', value: '92%' },
]

const ROWS = [
  { customer: 'Tolu A.', service: 'Deep tissue massage', time: 'Today, 2:30 PM', status: 'Confirmed' },
  { customer: 'Chidinma O.', service: 'Gel manicure', time: 'Today, 4:00 PM', status: 'Pending' },
  { customer: 'Bayo K.', service: 'Skin fade', time: 'Tomorrow, 10:00 AM', status: 'Confirmed' },
]

const STATUS_STYLE: Record<string, string> = {
  Confirmed: 'bg-emerald-50 text-emerald-700',
  Pending: 'bg-amber-50 text-amber-700',
}

export function DashboardMockup() {
  return (
    <div className="w-full max-w-2xl select-none overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/30">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[11px] text-slate-400 border border-slate-200">
          vendor.scalio.app/dashboard
        </span>
      </div>

      <div className="flex h-[340px]">
        <div className="hidden w-40 shrink-0 bg-slate-900 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white">
              S
            </div>
            <span className="text-xs font-semibold text-white">Scalio</span>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                  item.active ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Good morning, Amaka</p>
          <p className="text-xs text-slate-500">Here&apos;s what&apos;s happening today.</p>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-200/40">
                <p className="text-[10px] font-medium text-slate-400">{s.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm shadow-slate-200/40">
            <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-500">
              Upcoming bookings
            </div>
            <div className="divide-y divide-slate-50">
              {ROWS.map((row) => (
                <div key={row.customer} className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-900">{row.customer}</p>
                    <p className="truncate text-[10px] text-slate-400">{row.service} · {row.time}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[row.status]}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
