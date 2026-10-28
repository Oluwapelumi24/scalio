import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { mediaUrl } from '@/lib/growth'
import { AD_JOURNEY, AD_STATUS, journeyIndex, naira, type AdCampaignDetail } from '@/lib/ads'
import { StepProgress } from '@/components/StepProgress'
import { CampaignActions } from './CampaignActions'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

/** One ad: where it is on its journey, what it cost, and pay / extend / retry. */
export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; payError?: string }> }) {
  const { id } = await params
  const { paid, payError } = await searchParams
  const token = await requireToken()
  const [c, me] = await Promise.all([
    apiFetch<AdCampaignDetail>(`/vendor-admin/ads/campaigns/${id}`, token),
    apiFetch<{ role: string }>('/vendor-auth/me', token),
  ])
  const canManage = me.role === 'owner' || me.role === 'manager'
  const st = AD_STATUS[c.status]
  const journey = journeyIndex(c.status)
  const spentPct = c.paidSpendKobo > 0 ? Math.min(100, Math.round((c.spentKobo / c.paidSpendKobo) * 100)) : 0

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/ads" className="text-sm text-indigo-600">← Ads</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{c.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>{st.label}</span>
        </div>
      </div>

      {journey !== null && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <StepProgress steps={AD_JOURNEY} current={journey} />
        </div>
      )}

      <CampaignActions campaign={c} canManage={canManage} justPaid={paid === '1'} initialError={c.status === 'awaiting_payment' ? (payError ?? null) : null} />

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {c.mediaId && <img src={mediaUrl(c.mediaId)} alt="" className="aspect-square w-full rounded-lg object-cover" />}
          <p className="text-sm font-medium text-gray-900">{c.creative.headline}</p>
          <p className="text-sm text-gray-600">{c.creative.primaryText}</p>
        </div>
        <dl className="divide-y divide-gray-100 self-start rounded-xl border border-gray-200 bg-white">
          {[
            ['Goal', c.objectiveLabel],
            ['Budget', `${naira(c.dailyBudgetKobo)} a day`],
            ['Runs', `${day(c.startAt)} → ${day(c.endAt)} (${c.days} days)`],
            ['Paid via', c.route === 'scalio' ? 'Scalio' : 'Your Meta ad account'],
            ...(c.launchedAt ? [['Spent so far', c.route === 'scalio' ? `${naira(c.spentKobo)} of ${naira(c.paidSpendKobo)}` : naira(c.spentKobo)]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="text-gray-500">{k}</dt><dd className="text-right font-medium text-gray-900">{v}</dd></div>
          ))}
          {c.launchedAt && c.route === 'scalio' && (
            <div className="px-4 py-3"><div className="h-1.5 overflow-hidden rounded-full bg-indigo-50"><div className="h-full rounded-full bg-teal-500" style={{ width: `${spentPct}%` }} /></div></div>
          )}
        </dl>
      </div>
    </div>
  )
}
