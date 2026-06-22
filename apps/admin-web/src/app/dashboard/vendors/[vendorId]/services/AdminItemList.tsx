'use client'

import { useTransition } from 'react'
import { deleteServiceAction } from '@/app/actions/vendor-services'
import type { ServiceItem } from './page'

function formatPrice(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function fmtPayment(mode: string, pct: number | null) {
  if (mode === 'deposit' && pct) return `Deposit ${pct}%`
  return { pay_on_arrival: 'Pay on arrival', deposit: 'Deposit', full_prepayment: 'Full prepayment' }[mode] ?? mode
}

function DeleteBtn({ vendorId, id }: { vendorId: string; id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => { if (!confirm('Delete this item?')) return; startTransition(async () => { await deleteServiceAction(vendorId, id) }) }}
      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors shrink-0"
    >
      {pending ? '…' : 'Remove'}
    </button>
  )
}

export function AdminItemList({ vendorId, items, emptyLabel }: { vendorId: string; items: ServiceItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
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
          <DeleteBtn vendorId={vendorId} id={item.id} />
        </div>
      ))}
    </div>
  )
}
