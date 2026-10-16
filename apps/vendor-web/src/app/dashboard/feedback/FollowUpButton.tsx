'use client'

import { useState, useTransition } from 'react'
import { markFollowedUp } from '@/app/actions/insights'

export function FollowUpButton({ id }: { id: string }) {
  const [isPending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => start(async () => { const r = await markFollowedUp(id); if (r.error) setError(r.error) })}
        className="rounded-lg border border-slate-900 px-3 py-1 text-xs font-semibold text-slate-900 disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Done, followed up'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  )
}
