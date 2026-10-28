'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelAdCampaign, checkoutAdCampaign, extendAdCampaign, retryAdCampaign } from '@/app/actions/ads'
import { naira, type AdCampaignDetail } from '@/lib/ads'

/** What the vendor can do with an ad right now, plus plain-language notices. */
export function CampaignActions({ campaign: c, canManage, justPaid, initialError }: { campaign: AdCampaignDetail; canManage: boolean; justPaid: boolean; initialError: string | null }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError] = useState<string | null>(initialError)

  // Just back from Paystack, or Meta is still taking it: refresh every few seconds until it moves on.
  useEffect(() => {
    if (!['awaiting_payment', 'launching'].includes(c.status) || (c.status === 'awaiting_payment' && !justPaid)) return
    const t = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(t)
  }, [c.status, justPaid, router])

  const act = (fn: () => Promise<{ error?: string; data?: { paid?: boolean; authorizationUrl?: string | null } | unknown }>) => start(async () => {
    setError(null)
    const r = await fn()
    if (r.error) { setError(r.error); return }
    const d = r.data as { paid?: boolean; authorizationUrl?: string | null } | undefined
    if (d && d.paid === false && d.authorizationUrl) window.location.href = d.authorizationUrl
    else router.refresh()
  })

  const notice = (tone: 'info' | 'error', text: string, action?: { label: string; onClick: () => void }) => (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${tone === 'error' ? 'bg-red-50 text-red-800' : 'bg-indigo-50 text-indigo-900'}`}>
      <p className="flex-1">{text}</p>
      {action && canManage && (
        <button type="button" disabled={isPending} onClick={action.onClick} className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {isPending ? 'Working…' : action.label}
        </button>
      )}
    </div>
  )

  const canExtend = canManage && ['in_review', 'active', 'paused', 'completed'].includes(c.status)

  return (
    <div className="space-y-3">
      {c.status === 'awaiting_payment' && (justPaid
        ? notice('info', 'Confirming your payment with Paystack…')
        : notice('info', 'This ad isn’t paid for yet. Pay to send it to Meta for review.', { label: 'Pay now', onClick: () => act(() => checkoutAdCampaign(c.id)) }))}
      {c.status === 'launching' && notice('info', 'Payment received. We’re sending your ad to Meta…')}
      {c.status === 'in_review' && notice('info', 'Meta is reviewing your ad. This usually takes a few hours, at most a day.')}
      {c.status === 'rejected' && notice('error', `Meta didn’t approve this ad.${c.reviewNote ? ` Meta said: ${c.reviewNote}` : ''}${c.route === 'scalio' ? ' Unspent money has come back as ad credit.' : ''}`)}
      {c.status === 'failed' && notice('error', `Your ad is paid for, but Meta didn’t accept it yet. ${c.lastError ? c.lastError.replace(/[.\s]*$/, '.') : ''} Fix it and try again — you won’t pay twice.`, { label: 'Try again', onClick: () => act(() => retryAdCampaign(c.id)) })}

      {canExtend && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="font-medium text-gray-900">Keep it running</p>
          <p className="text-sm text-gray-500">Add more days at the same daily budget.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[7, 14, 30].map((d) => {
              const q = c.quoteForExtension[String(d)]
              return (
                <button key={d} type="button" disabled={isPending} onClick={() => {
                  const msg = q.route === 'scalio' ? `Run ${d} more days for ${naira(q.dueNowKobo)} (spend + VAT + Scalio fee)?` : `Run ${d} more days? You pay Scalio’s fee of ${naira(q.dueNowKobo)}; Meta charges your card for the extra spend.`
                  if (confirm(msg)) act(() => extendAdCampaign(c.id, d))
                }} className="rounded-lg border-2 border-indigo-700 py-2 text-center hover:bg-indigo-50 disabled:opacity-50">
                  <span className="block text-sm font-semibold text-indigo-700">+{d} days</span>
                  <span className="block text-xs text-gray-500">{naira(q.dueNowKobo)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {canManage && ['awaiting_payment', 'failed'].includes(c.status) && (
        <button type="button" disabled={isPending} className="text-sm font-medium text-red-600 hover:text-red-800" onClick={() => {
          if (confirm(c.status === 'failed' && c.route === 'scalio' ? 'Cancel this ad? What you paid for ad spend comes back as ad credit.' : 'Cancel this ad?')) act(() => cancelAdCampaign(c.id))
        }}>Cancel this ad</button>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
