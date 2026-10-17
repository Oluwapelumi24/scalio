import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { AdsSetup } from '@/lib/growth'
import { AdsChecklist } from './AdsChecklist'

/** Ads — "Connect your accounts" checklist before a business can run ads (ADS_MANAGER_PLAN.md §2a). */
export default async function AdsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')
  const setup = await apiFetch<AdsSetup>('/vendor-admin/ads/setup', token)
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

      <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${setup.ready ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-900'}`}>
        {setup.ready ? '✓ You’re ready to run ads. Creating ads is coming next.' : `${done} of ${required.length} required steps done`}
      </div>

      <AdsChecklist steps={setup.steps} canManage={canManage && setup.available} />

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
