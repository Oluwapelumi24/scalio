'use client'

import { useState, useTransition } from 'react'
import { checkAccount, savePayoutAccount } from '@/app/actions/finance'
import type { Bank } from '@/lib/finance'

/** Bank + account number → check the name with the bank → save. Shared by payout and staff accounts. */
export function AccountForm({
  banks,
  onSave,
  saveLabel = 'Use this account',
}: {
  banks: Bank[]
  onSave?: (bankCode: string, accountNumber: string) => Promise<{ error?: string }>
  saveLabel?: string
}) {
  const [bankCode, setBankCode] = useState('')
  const [number, setNumber] = useState('')
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const reset = () => { setName(null); setError(null); setDone(false) }

  const check = () =>
    startTransition(async () => {
      if (!bankCode || !/^\d{10}$/.test(number)) { setError('Choose a bank and enter the 10-digit account number.'); return }
      const r = await checkAccount(bankCode, number)
      if (r.error) setError(r.error)
      else setName(r.data!.accountName)
    })
  const save = () =>
    startTransition(async () => {
      const r = await (onSave ?? savePayoutAccount)(bankCode, number)
      if (r.error) setError(r.error)
      else { setDone(true); setNumber(''); setName(null) }
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <select
          value={bankCode}
          onChange={(e) => { setBankCode(e.target.value); reset() }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          aria-label="Bank"
        >
          <option value="">Choose bank</option>
          {banks.map((b) => <option key={b.code + b.name} value={b.code}>{b.name}</option>)}
        </select>
        <input
          inputMode="numeric"
          value={number}
          onChange={(e) => { setNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); reset() }}
          placeholder="10-digit account number"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 w-56"
          aria-label="Account number"
        />
        {name ? (
          <button type="button" onClick={save} disabled={isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {isPending ? 'Saving…' : saveLabel}
          </button>
        ) : (
          <button type="button" onClick={check} disabled={isPending} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">
            {isPending ? 'Checking…' : 'Check account'}
          </button>
        )}
      </div>
      {name && <p className="text-sm text-emerald-700">✓ {name}</p>}
      {done && <p className="text-sm text-emerald-700">Saved.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
