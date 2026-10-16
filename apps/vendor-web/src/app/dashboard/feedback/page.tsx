import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { waNumber } from '@/lib/growth'
import type { FeedbackOverview } from '@/lib/insights'
import { requireToken } from '@/lib/session'
import { FollowUpButton } from './FollowUpButton'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const PERIODS = [{ id: '30', label: 'Last 30 days' }, { id: '90', label: 'Last 90 days' }, { id: '365', label: 'Last year' }]
const stars = (n: number) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n))

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const token = await requireToken()
  const requested = (await searchParams).p
  const p = PERIODS.find((x) => x.id === requested)?.id ?? '30'
  const now = new Date()
  const from = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Number(p) - 1)))
  const [me, data] = await Promise.all([
    apiFetch<{ role: string }>('/vendor-auth/me', token),
    apiFetch<FeedbackOverview>(`/vendor-admin/feedback?from=${from}&to=${iso(now)}`, token),
  ])
  const max = Math.max(...data.distribution.map((d) => d.count), 1)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            {me.role === 'practitioner' ? 'Ratings for your appointments.' : 'Customers rate their visit after each completed booking.'} Ratings are private to your business.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((x) => (
            <Link key={x.id} href={`/dashboard/feedback?p=${x.id}`} className={`rounded-full border px-3 py-1 text-sm font-medium ${p === x.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-700'}`}>{x.label}</Link>
          ))}
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{data.average ?? '—'}</p>
            {data.average !== null && <p className="text-amber-500" aria-label={`${data.average} out of 5`}>{stars(data.average)}</p>}
            <p className="text-xs text-gray-500">{data.count} rating{data.count === 1 ? '' : 's'}</p>
          </div>
          <div className="flex-1 space-y-1">
            {[...data.distribution].reverse().map((d) => (
              <div key={d.stars} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-6">{d.stars}★</span>
                <div className="h-2 flex-1 rounded bg-gray-100"><div className="h-2 rounded bg-amber-400" style={{ width: `${(d.count / max) * 100}%` }} /></div>
                <span className="w-6 text-right text-gray-400">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {data.asked} customer{data.asked === 1 ? ' was' : 's were'} asked in this period. Customers with an email get the link automatically; for others, use “Ask for feedback” on a completed booking.
        </p>
      </section>

      {data.items.length === 0 ? (
        <p className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500">No ratings yet for this period.</p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((f) => (
            <li key={f.id} className={`rounded-xl border p-5 space-y-2 ${f.needsFollowUp ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-amber-500" aria-label={`${f.rating} out of 5`}>{stars(f.rating)}</span>
                <span className="text-xs text-gray-500">{new Date(f.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              {f.comment && <p className="text-sm text-gray-900">“{f.comment}”</p>}
              <p className="text-xs text-gray-500">
                <Link href={`/dashboard/customers/${f.customer.id}`} className="font-medium text-gray-700 hover:text-indigo-600">{f.customer.name}</Link>
                {' '}· visit {new Date(f.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{f.staffName ? ` · ${f.staffName}` : ''}
              </p>
              {f.needsFollowUp && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                  {f.customer.phone && <a href={`tel:${f.customer.phone}`} className="font-medium text-indigo-600">Call {f.customer.phone}</a>}
                  {f.customer.phone && (
                    <a
                      href={`https://wa.me/${waNumber(f.customer.phone)}?text=${encodeURIComponent(`Hi ${f.customer.name.split(' ')[0]}, thank you for your feedback. We're sorry your visit wasn't great — could we make it right?`)}`}
                      target="_blank" rel="noreferrer" className="font-medium text-indigo-600"
                    >WhatsApp</a>
                  )}
                  {me.role !== 'practitioner' && <FollowUpButton id={f.id} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
