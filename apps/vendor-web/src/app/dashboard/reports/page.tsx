import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { naira } from '@/lib/finance'
import { PERIOD_LABELS, pct, periodRange, type ReportGroup, type ReportKind, type ReportsOverview } from '@/lib/insights'
import { requireToken } from '@/lib/session'

const signed = (k: number) => (k < 0 ? `−${naira(-k)}` : naira(k))

type Drill = (kind: ReportKind, key?: string) => string

function Groups({ kind, groups, drill, money = true, max = 8 }: { kind: ReportKind; groups: ReportGroup[]; drill: Drill; money?: boolean; max?: number }) {
  if (groups.length === 0) return <p className="text-sm text-gray-500">Nothing in this period.</p>
  const top = Math.max(...groups.map((g) => (money ? g.amountKobo ?? 0 : g.count)), 1)
  return (
    <ul className="space-y-2">
      {groups.slice(0, max).map((g) => {
        const v = money ? g.amountKobo ?? 0 : g.count
        return (
          <li key={g.key}>
            <Link href={drill(kind, g.key)} className="group block" title="See the records behind this figure">
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-gray-800 group-hover:text-indigo-600">{g.label}</span>
                <span className="tabular-nums font-medium text-gray-900">{money ? naira(v) : v}{money && <span className="ml-2 text-xs text-gray-400">{g.count}</span>}</span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-gray-100"><div className="h-1.5 rounded bg-indigo-500" style={{ width: `${Math.max(2, (v / top) * 100)}%` }} /></div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="tabular-nums text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function Card({ title, kind, drill, definition, children }: { title: string; kind: ReportKind; drill: Drill; definition: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <Link href={drill(kind)} className="text-sm font-medium text-indigo-600">See all</Link>
      </div>
      {children}
      <p className="text-xs text-gray-400">{definition}</p>
    </section>
  )
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard')

  const period = periodRange((await searchParams).p)
  const r = await apiFetch<ReportsOverview>(`/vendor-admin/reports?from=${period.from}&to=${period.to}`, token)
  const d = r.definitions
  const drill = (kind: ReportKind, key?: string) =>
    `/dashboard/reports/${kind}?from=${period.from}&to=${period.to}${key ? `&key=${encodeURIComponent(key)}` : ''}`

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Click any figure to see the records behind it.</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_LABELS.map((p) => (
            <Link key={p.id} href={`/dashboard/reports?p=${p.id}`} className={`rounded-full border px-3 py-1 text-sm font-medium ${period.id === p.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>{p.label}</Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card drill={drill} title="Sales" kind="sales" definition={d.sales}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sales" value={naira(r.sales.salesKobo)} />
            <Stat label="Completed" value={String(r.sales.completed)} />
            <Stat label="Average sale" value={r.sales.averageSaleKobo === null ? '—' : naira(r.sales.averageSaleKobo)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">By service</h3><Groups drill={drill} kind="sales" groups={r.sales.byService} /></div>
            <div><h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">By staff</h3><Groups drill={drill} kind="sales" groups={r.sales.byStaff} /></div>
          </div>
        </Card>

        <Card drill={drill} title="Bookings" kind="bookings" definition={`${d.cancellationRate} ${d.noShowRate}`}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Bookings" value={String(r.bookings.total)} />
            <Stat label="Cancelled" value={pct(r.bookings.cancellationRate)} />
            <Stat label="No-shows" value={pct(r.bookings.noShowRate)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">By status</h3><Groups drill={drill} kind="bookings" groups={r.bookings.byStatus} money={false} /></div>
            <div><h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Busiest days</h3><Groups drill={drill} kind="bookings" groups={r.bookings.byWeekday} money={false} /></div>
          </div>
        </Card>

        <Card drill={drill} title="Cash flow" kind="cashflow" definition={d.cashflow}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="In" value={naira(r.cashflow.inKobo)} />
            <Stat label="Out" value={naira(r.cashflow.outKobo)} />
            <Stat label="Net" value={signed(r.cashflow.netKobo)} />
          </div>
          <Groups drill={drill} kind="cashflow" groups={r.cashflow.groups} />
        </Card>

        <Card drill={drill} title="Expenses" kind="expenses" definition={d.expenses}>
          <div className="grid grid-cols-3 gap-3"><Stat label="Total" value={naira(r.expenses.totalKobo)} /></div>
          <Groups drill={drill} kind="expenses" groups={r.expenses.byCategory} />
        </Card>

        <Card drill={drill} title="New customers" kind="customers" definition={d.newCustomers}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="New" value={String(r.customers.newCustomers)} />
            <Stat label="Have visited" value={String(r.customers.visited)} />
          </div>
          <Groups drill={drill} kind="customers" groups={r.customers.bySource} money={false} />
        </Card>

        <Card drill={drill} title="Keeping customers" kind="retention" definition={`${d.returning} ${d.repeatRate} ${d.lapsed}`}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Served" value={String(r.retention.served)} />
            <Stat label="Came back" value={pct(r.retention.returningRate)} />
            <Stat label="Repeat (all time)" value={pct(r.retention.repeatRate)} />
          </div>
          <Groups drill={drill} kind="retention" groups={r.retention.groups} money={false} />
        </Card>
      </div>
    </div>
  )
}
