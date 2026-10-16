import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, type Lead } from '@/lib/growth'
import { AddLeadForm } from './LeadControls'

type Filter = 'due' | 'open' | 'won' | 'lost'
const FILTERS: { id: Filter; label: string; empty: string }[] = [
  { id: 'due', label: 'To follow up', empty: 'Nobody to follow up right now.' },
  { id: 'open', label: 'All open', empty: 'No open leads. Add people who ask about your business — from DMs, calls or walk-ins — so nobody slips through.' },
  { id: 'won', label: 'Customers', empty: 'Leads you turn into customers show up here.' },
  { id: 'lost', label: 'Not interested', empty: 'Nothing here.' },
]

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const token = await requireToken()
  const requested = (await searchParams).filter
  const filter = (FILTERS.find((f) => f.id === requested)?.id ?? 'due') as Filter
  const query = filter === 'due' ? '?due=1' : filter === 'open' ? '' : `?status=${filter}`

  const [me, all, summary] = await Promise.all([
    apiFetch<{ role: string }>('/vendor-auth/me', token),
    apiFetch<Lead[]>(`/vendor-admin/leads${query}`, token),
    apiFetch<{ open: number; due: number; won30d: number }>('/vendor-admin/leads/summary', token),
  ])
  const leads = filter === 'open' ? all.filter((l) => l.status === 'new' || l.status === 'contacted') : all
  const practitioner = me.role === 'practitioner'
  const staff = practitioner ? [] : await apiFetch<{ id: string; name: string }[]>('/vendor-admin/staff', token).catch(() => [])

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">
          People who asked about your business. {summary.open} open · {summary.due} to follow up · {summary.won30d} became customers in the last 30 days{practitioner ? ' (yours)' : ''}.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Add a lead</h2>
        <AddLeadForm staff={staff} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link key={f.id} href={`/dashboard/leads?filter=${f.id}`} className={`rounded-full border px-3 py-1 text-sm font-medium ${filter === f.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>
              {f.label}
            </Link>
          ))}
        </div>
        {leads.length === 0 ? (
          <p className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500">{FILTERS.find((f) => f.id === filter)!.empty}</p>
        ) : (
          <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {leads.map((l) => (
              <li key={l.id}>
                <Link href={`/dashboard/leads/${l.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                    <p className="text-xs text-gray-500">
                      {LEAD_SOURCE_LABELS[l.source]} · {LEAD_STATUS_LABELS[l.status]}
                      {l.assignedStaff && !practitioner ? ` · ${l.assignedStaff.name}` : ''}
                    </p>
                    {l.note && <p className="truncate text-xs text-gray-600">{l.note}</p>}
                  </div>
                  {l.due ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Follow up</span>
                  ) : l.followUpAt && (l.status === 'new' || l.status === 'contacted') ? (
                    <span className="text-xs text-gray-500">{new Date(l.followUpAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  ) : null}
                  <span className="text-gray-400">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
