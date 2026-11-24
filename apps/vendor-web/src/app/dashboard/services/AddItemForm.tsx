'use client'

import { useState, useTransition } from 'react'
import { createService } from '@/app/actions/services'
import { SelectMenu } from '@/components/SelectMenu'

export function AddItemForm({ serviceType, placeholder }: { serviceType: 'package' | 'service'; placeholder: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [paymentMode, setPaymentMode] = useState('pay_on_arrival')
  const [depositPct, setDepositPct] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setName(''); setDuration(''); setPrice('')
    setPaymentMode('pay_on_arrival'); setDepositPct('')
    setError(null); setOpen(false)
  }

  function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('serviceType', serviceType)
      fd.set('name', name.trim())
      if (duration) fd.set('durationMinutes', duration)
      if (price) fd.set('priceNaira', price)
      fd.set('paymentMode', paymentMode)
      if (paymentMode === 'deposit' && depositPct) fd.set('depositPercent', depositPct)
      const result = await createService(null, fd)
      if (result?.error) setError(result.error)
      else reset()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-[#1e3a8a]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-bold leading-none text-white">+</span>
        Add {serviceType}
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-[#f7f8fa] p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min={0} placeholder="30"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Price (₦)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} placeholder="5000"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Payment mode</label>
          <SelectMenu
            value={paymentMode}
            onChange={setPaymentMode}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            options={[
              { value: 'pay_on_arrival', label: 'Pay on arrival' },
              { value: 'deposit', label: 'Deposit' },
              { value: 'full_prepayment', label: 'Full prepayment' },
            ]}
          />
        </div>
        {paymentMode === 'deposit' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deposit %</label>
            <input value={depositPct} onChange={(e) => setDepositPct(e.target.value)} type="number" min={1} max={100} placeholder="30"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <div className="flex items-center gap-3 mt-3">
        <button onClick={handleSave} disabled={isPending}
          className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white disabled:opacity-60">
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  )
}
