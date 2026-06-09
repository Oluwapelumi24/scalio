'use client'

import { useActionState } from 'react'
import { createService } from '@/app/actions/services'

export function CreateServiceForm() {
  const [state, formAction, pending] = useActionState(createService, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 items-end">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">Service name *</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Classic Haircut"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min) *</label>
        <input
          name="durationMinutes"
          type="number"
          min={1}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Price (₦) *</label>
        <input
          name="priceNaira"
          type="number"
          min={0}
          step="0.01"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="5000"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Payment mode</label>
        <select
          name="paymentMode"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="pay_on_arrival">Pay on arrival</option>
          <option value="deposit">Deposit</option>
          <option value="full_prepayment">Full prepayment</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Deposit % (if deposit)</label>
        <input
          name="depositPercent"
          type="number"
          min={1}
          max={100}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="30"
        />
      </div>

      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Adding…' : 'Add service'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  )
}
