import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { AdsSetup } from '@/lib/growth'
import Link from 'next/link'
import { mediaUrl } from '@/lib/growth'
import { AD_STATUS, naira, type AdCampaign } from '@/lib/ads'
import { AdsChecklist } from './AdsChecklist'
import { Icon } from '@/components/Icon'

/** Ads — "Connect your accounts" checklist before a business can run ads (ADS_MANAGER_PLAN.md §2a). */
export default async function AdsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')
  const [setup, list] = await Promise.all([
    apiFetch<AdsSetup>('/vendor-admin/ads/setup', token),
    apiFetch<{ campaigns: AdCampaign[]; creditKobo: number }>('/vendor-admin/ads/campaigns', token).catch(() => ({ campaigns: [], creditKobo: 0 })),
  ])
  const canManage = me.role === 'owner' || me.role === 'manager'
  const required = setup.steps.filter((s) => !s.optional)
  const done = required.filter((s) => s.state === 'done').length

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get more customers with Facebook and Instagram ads. First, connect your accounts — it takes about two minutes.
        </p>
      </div>

      {!setup.available && (
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">{setup.unavailableReason}</p>
      )}

      {setup.ready && canManage && (
        <Link href="/dashboard/ads/new" className="flex items-center gap-4 rounded-xl bg-indigo-800 p-5 text-white shadow-sm transition hover:bg-indigo-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><Icon name="plus" className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-semibold">Create an ad</span><span className="block text-sm text-indigo-100">Get more chats from people near you — about 3 minutes.</span></span>
          <Icon name="arrow-right" className="h-5 w-5 opacity-80" />
        </Link>
      )}

      {list.creditKobo > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Icon name="gift" className="h-4 w-4 shrink-0" />You have {naira(list.creditKobo)} ad credit from unspent budget. It’s used automatically on your next ad.</p>
      )}

      {list.campaigns.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">Your ads</h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {list.campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/ads/campaigns/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.mediaId ? <img src={mediaUrl(c.mediaId)} alt="" className="h-12 w-12 rounded-md bg-gray-100 object-cover" /> : <span className="h-12 w-12 rounded-md bg-indigo-50" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{c.name}</span>
                    <span className="block text-xs text-gray-500">{c.objectiveLabel} · {naira(c.dailyBudgetKobo)}/day · ends {new Date(c.endAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${AD_STATUS[c.status].className}`}>{AD_STATUS[c.status].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-500">Setup</h2>
        <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${setup.ready ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-900'}`}>
          {setup.ready ? '✓ Your accounts are connected.' : `${done} of ${required.length} required steps done`}
        </div>
        <AdsChecklist steps={setup.steps} canManage={canManage && setup.available} />
      </section>

      {!canManage && <p className="text-sm text-gray-600">Ask an owner or manager to connect accounts for ads.</p>}

      <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">
        <p className="font-semibold text-gray-900">Two ways to pay for ads</p>
        <p>
          Pay with Scalio by card, bank transfer or USSD in naira — no dollar card needed. Or, if you already have a Meta ad
          account with a card Meta accepts, Meta can charge that card directly. You’ll choose when you launch an ad.
        </p>
      </div>
    </div>
  )
}
