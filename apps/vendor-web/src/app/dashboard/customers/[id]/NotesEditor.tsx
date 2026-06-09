'use client'

import { useActionState } from 'react'
import { updateCustomerNotes } from '@/app/actions/customers'

export function NotesEditor({ customerId, initialNotes }: { customerId: string; initialNotes: string | null }) {
  const action = updateCustomerNotes.bind(null, customerId)
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="notes"
        defaultValue={initialNotes ?? ''}
        rows={5}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        placeholder="Add notes about this customer…"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Saving…' : 'Save notes'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  )
}
