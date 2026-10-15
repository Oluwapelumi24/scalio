import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { naira, type Expense, type LedgerEntry, type MoneySummary } from '@/lib/finance'
import { ExpenseForm, VoidButton } from './ExpenseControls'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const signed = (kobo: number) => (kobo < 0 ? `−${naira(-kobo)}` : naira(kobo))

export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard')

  const offset = (await searchParams).m === '-1' ? -1 : 0
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  const q = `from=${iso(start)}&to=${iso(end)}`
  const [summary, entries, expenses, categories] = await Promise.all([
    apiFetch<MoneySummary>(`/vendor-admin/money/summary?${q}`, token),
    apiFetch<LedgerEntry[]>(`/vendor-admin/money/ledger?${q}`, token),
    apiFetch<Expense[]>(`/vendor-admin/money/expenses?${q}`, token),
    apiFetch<string[]>('/vendor-admin/money/expense-categories', token),
  ])
  const rows: [string, number, string?][] = [
    ['Sales', summary.salesKobo, 'Completed bookings at their booked price'],
    ['Received online', summary.receivedOnlineKobo, 'Paid to your bank by Paystack'],
    ['Salaries paid', -summary.salariesKobo],
    ['Expenses', -summary.expensesKobo],
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Money</h1>
          <p className="text-sm text-gray-500 mt-1">What came in and went out. Scalio records it; the money stays in your bank.</p>
        </div>
        <div className="flex gap-2">
          {[0, -1].map((o) => (
            <Link key={o} href={o === 0 ? '/dashboard/money' : '/dashboard/money?m=-1'} className={`rounded-full border px-3 py-1 text-sm font-medium ${offset === o ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>
              {o === 0 ? 'This month' : 'Last month'}
            </Link>
          ))}
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900 mb-2">{start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
        <dl className="divide-y divide-gray-100">
          {rows.map(([label, value, hint]) => (
            <div key={label} className="flex items-center justify-between py-3">
              <dt>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {hint && <p className="text-xs text-gray-500">{hint}</p>}
              </dt>
              <dd className={`tabular-nums font-semibold ${value < 0 ? 'text-gray-500' : 'text-gray-900'}`}>{signed(value)}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <dt className="font-bold text-gray-900">Left over</dt>
            <dd className={`tabular-nums text-xl font-bold ${summary.netKobo < 0 ? 'text-red-600' : 'text-gray-900'}`}>{signed(summary.netKobo)}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Add an expense</h2>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <ExpenseForm categories={categories} today={iso(now)} />
        </div>
      </section>

      {expenses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Expenses</h2>
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{e.category}{e.note ? ` · ${e.note}` : ''}</p>
                  <p className="text-xs text-gray-500">{e.spentOn}</p>
                </div>
                <span className="tabular-nums font-semibold text-gray-900">{naira(e.amountKobo)}</span>
                <VoidButton id={e.id} label={`${e.category} · ${naira(e.amountKobo)}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Activity</h2>
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {entries.length === 0 ? (
            <li className="px-5 py-4 text-sm text-gray-500">Nothing recorded this month yet.</li>
          ) : entries.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className={e.direction === 'in' ? 'text-emerald-600' : 'text-gray-400'}>{e.direction === 'in' ? '↙' : '↗'}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{e.description}</p>
                <p className="text-xs text-gray-500">{new Date(e.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
              </div>
              <span className={`tabular-nums font-semibold ${e.direction === 'in' ? 'text-gray-900' : 'text-gray-500'}`}>{e.direction === 'in' ? '+' : '−'}{naira(e.amountKobo)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
