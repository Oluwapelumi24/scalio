'use client'

import { useState, useTransition } from 'react'
import { setClock } from '@/app/actions/staff-schedule'

export function ClockButton({
  clockedIn,
  staffId,
  large = false,
}: {
  clockedIn: boolean
  staffId?: string
  large?: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const label = clockedIn ? 'Clock out' : 'Clock in'

  const click = () =>
    startTransition(async () => {
      const r = await setClock(clockedIn ? 'out' : 'in', staffId)
      setError(r?.error ?? null)
    })

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={click}
        disabled={isPending}
        className={
          large
            ? `rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${clockedIn ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'}`
            : 'rounded-full border border-indigo-600 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50'
        }
      >
        {isPending ? '…' : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
