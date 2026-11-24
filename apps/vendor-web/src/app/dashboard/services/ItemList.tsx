'use client'

import { useState, useTransition } from 'react'
import { deleteService } from '@/app/actions/services'
import { useAskConfirm } from '@/components/askConfirm'
import type { ServiceItem } from './ServicesPanel'

function formatPrice(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function fmtPayment(mode: string, pct: number | null) {
  if (mode === 'deposit' && pct) return `Deposit ${pct}%`
  return { pay_on_arrival: 'Pay on arrival', deposit: 'Deposit', full_prepayment: 'Full prepayment' }[mode] ?? mode
}

function DeleteBtn({ id, noun }: { id: string; noun: string }) {
  const { askConfirm, dialog } = useAskConfirm()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void (async () => {
            if (!(await askConfirm(`Remove this ${noun}?`, 'Remove'))) return
            setError(null)
            startTransition(async () => {
              const result = await deleteService(id)
              if (result?.error) setError(result.error)
            })
          })()
        }}
        className="text-xs text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
      >
        {pending ? 'Removing…' : 'Remove'}
      </button>
      {error ? <span className="mt-1 max-w-40 text-right text-xs text-red-600">{error}</span> : null}
      {dialog}
    </span>
  )
}

export function ItemList({
  items,
  emptyLabel,
  emptyHint,
  noun,
}: {
  items: ServiceItem[]
  emptyLabel: string
  emptyHint?: string
  noun: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f7f8fa] px-5 py-6 text-center">
        <p className="text-sm font-medium text-[#4a4e57]">{emptyLabel}</p>
        {emptyHint ? <p className="mt-1 text-sm text-[#7d818b]">{emptyHint}</p> : null}
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#eef0f3] overflow-hidden rounded-2xl bg-[#f7f8fa]">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            {item.priceKobo > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{fmtPayment(item.paymentMode, item.depositPercent)}</p>
            )}
          </div>
          {item.durationMinutes > 0 && (
            <span className="text-sm text-gray-500 shrink-0">{item.durationMinutes} min</span>
          )}
          {item.priceKobo > 0 && (
            <span className="text-sm font-semibold text-gray-800 shrink-0 w-24 text-right">{formatPrice(item.priceKobo)}</span>
          )}
          <DeleteBtn id={item.id} noun={noun} />
        </div>
      ))}
    </div>
  )
}
