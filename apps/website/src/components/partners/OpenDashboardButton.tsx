'use client'

import { useActionState } from 'react'
import { openDashboardAction, type VendorAuthState } from '@/app/actions/vendor'

const EMPTY: VendorAuthState = {}

/** Opens the seller dashboard via one-time handoff, or explains the env gap. */
export function OpenDashboardButton({ label = 'Open dashboard' }: { label?: string }) {
  const [state, action, pending] = useActionState(openDashboardAction, EMPTY)
  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-2xl bg-navy px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Opening…' : label}
      </button>
      {state.error ? <p className="mt-2 text-sm text-red-700">{state.error}</p> : null}
    </form>
  )
}
