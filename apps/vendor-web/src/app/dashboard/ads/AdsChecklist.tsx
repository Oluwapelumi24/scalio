'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { chooseAdAccount, listMetaAdAccounts, metaConnectUrlForAds, refreshAdAccount } from '@/app/actions/growth'
import type { AdsSetupStep, MetaAdAccountOption } from '@/lib/growth'

function actionLabel(step: AdsSetupStep): string {
  const a = step.action!
  if (a.kind === 'open_url') return `${a.label} ↗`
  if (a.kind === 'choose_ad_account') return step.state === 'done' ? 'Change' : 'Choose ad account'
  return step.state === 'attention' || step.key !== 'facebook' ? 'Reconnect Facebook' : 'Connect Facebook'
}

export function AdsChecklist({ steps, canManage }: { steps: AdsSetupStep[]; canManage: boolean }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<MetaAdAccountOption[] | null>(null)
  // Set when Meta's payment page opens in a new tab, so coming back re-checks the card.
  const recheckOnReturn = useRef(false)
  const hasAccount = steps.some((s) => s.key === 'payment_method' || (s.key === 'ad_account' && s.state !== 'todo' && s.state !== 'waiting'))

  useEffect(() => {
    function onFocus() {
      if (!recheckOnReturn.current) return
      recheckOnReturn.current = false
      start(async () => { const r = await refreshAdAccount(); if (r.error) setError(r.error) })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function run(step: AdsSetupStep) {
    const a = step.action
    if (!a) return
    setError(null)
    if (a.kind === 'open_url') {
      recheckOnReturn.current = true
      window.open(a.url, '_blank', 'noopener')
      return
    }
    start(async () => {
      if (a.kind === 'connect') {
        const r = await metaConnectUrlForAds()
        if (r.error || !r.data) setError(r.error ?? 'Could not start connecting.')
        else window.location.href = r.data.url
      } else {
        const r = await listMetaAdAccounts()
        if (r.error || !r.data) {
          setError(r.error ?? 'Could not load your ad accounts.')
          router.refresh() // a Meta error can change the checklist, e.g. access was revoked
        } else setAccounts(r.data)
      }
    })
  }

  function pick(id: string) {
    start(async () => {
      const r = await chooseAdAccount(id)
      if (r.error) setError(r.error)
      else setAccounts(null)
    })
  }

  return (
    <div className="space-y-4">
      <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {steps.map((s) => {
          const muted = s.state === 'waiting' || s.state === 'coming_soon'
          return (
            <li key={s.key} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="space-y-1">
                <p className={`text-sm font-semibold ${muted ? 'text-gray-400' : 'text-gray-900'}`}>
                  {s.title}
                  {s.optional && s.state !== 'done' && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-gray-500">
                      {s.state === 'coming_soon' ? 'Coming soon' : 'Optional'}
                    </span>
                  )}
                </p>
                <p className={`text-xs ${s.state === 'attention' ? 'text-red-600' : 'text-gray-500'}`}>{s.detail}</p>
                {s.action && canManage && (
                  <button type="button" disabled={isPending} onClick={() => run(s)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-60">
                    {actionLabel(s)}
                  </button>
                )}
              </div>
              {s.state === 'done' && <span className="text-emerald-600 text-sm font-medium">✓</span>}
              {s.state === 'attention' && <span className="text-red-600 text-sm font-medium">!</span>}
            </li>
          )
        })}
      </ul>

      {accounts && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Choose your ad account</p>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">Your Facebook login has no ad accounts. That’s fine — skip this and pay for ads with Scalio when you launch one.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {accounts.map((a) => (
                <li key={a.id}>
                  <button type="button" disabled={isPending} onClick={() => pick(a.id)} className="w-full py-3 text-left disabled:opacity-60">
                    <span className="block text-sm font-medium text-gray-900">{a.name}{a.chosen && ' ✓'}</span>
                    <span className="block text-xs text-gray-500">
                      {[a.businessName, a.currency, a.hasPaymentMethod ? (a.paymentMethodLabel ?? 'Card added') : 'No card yet'].filter(Boolean).join(' · ')}
                    </span>
                    {a.problem && <span className="block text-xs text-red-600">{a.problem}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setAccounts(null)} className="text-sm font-medium text-gray-600">Cancel</button>
        </div>
      )}

      {hasAccount && canManage && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => start(async () => { setError(null); const r = await refreshAdAccount(); if (r.error) setError(r.error) })}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-60"
        >
          {isPending ? 'Checking…' : 'Check my ad account again'}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
