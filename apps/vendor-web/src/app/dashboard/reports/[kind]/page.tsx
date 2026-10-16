import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { naira } from '@/lib/finance'
import { REPORT_TITLES, type ReportKind, type ReportRecord } from '@/lib/insights'
import { requireToken } from '@/lib/session'

const STATUS: Record<string, string> = {
  completed: 'Completed', confirmed: 'Coming up', pending_payment: 'Waiting for payment',
  cancelled_by_customer: 'Cancelled by customer', cancelled_by_vendor: 'Cancelled by you', no_show: 'No-show',
}
const when = (at: string | null) => (at ? new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default async function ReportRecordsPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ from?: string; to?: string; key?: string }> }) {
  const { kind } = await params
  if (!(kind in REPORT_TITLES)) notFound()
  const { from, to, key } = await searchParams
  if (!from || !to) redirect('/dashboard/reports')
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard')

  let records: ReportRecord[]
  try {
    records = await apiFetch<ReportRecord[]>(`/vendor-admin/reports/${kind}/records?${new URLSearchParams({ from, to, ...(key ? { key } : {}) })}`, token)
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) notFound()
    throw err
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/dashboard/reports" className="text-sm text-indigo-600">← Reports</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{REPORT_TITLES[kind as ReportKind]}</h1>
        <p className="text-sm text-gray-500">{when(from)} – {when(to)} · {records.length}{records.length >= 500 ? '+' : ''} records{key ? ` · filtered` : ''}</p>
      </div>
      {records.length === 0 ? (
        <p className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500">Nothing here for this period.</p>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {records.map((r) => {
            const title = r.type === 'booking' ? r.customerName ?? 'Customer' : r.type === 'customer' ? r.name : r.label
            const detail = r.type === 'booking'
              ? [when(r.at), r.status ? STATUS[r.status] ?? r.status : null, r.services?.join(', '), r.staffName].filter(Boolean).join(' · ')
              : r.type === 'customer'
                ? [r.label, r.visits !== undefined ? `${r.visits} visit${r.visits === 1 ? '' : 's'}` : null, r.at ? `last ${when(r.at)}` : null, r.phone].filter(Boolean).join(' · ')
                : [when(r.at), r.note].filter(Boolean).join(' · ')
            const amount = r.amountKobo === undefined ? null : r.type === 'ledger' ? `${r.direction === 'in' ? '+' : '−'}${naira(r.amountKobo)}` : naira(r.amountKobo)
            const row = (
              <div className="flex items-center gap-4 px-5 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
                {amount && <span className="tabular-nums font-semibold text-gray-900">{amount}</span>}
              </div>
            )
            return <li key={r.id}>{r.type === 'customer' ? <Link href={`/dashboard/customers/${r.id}`} className="block hover:bg-gray-50">{row}</Link> : row}</li>
          })}
        </ul>
      )}
    </div>
  )
}
