'use client'

import { useActionState, useState, useTransition } from 'react'
import { addBlackoutDate, removeBlackoutDate } from '@/app/actions/schedule'

interface BlackoutDate {
  id: string
  date: string
  reason: string | null
}

export function BlackoutDatesForm({ initialBlackouts }: { initialBlackouts: BlackoutDate[] }) {
  const [addState, formAction, pending] = useActionState(addBlackoutDate, null)
  const [removeIsPending, startRemoveTransition] = useTransition()
  const [removeError, setRemoveError] = useState<string | null>(null)

  const handleRemove = (id: string) => {
    setRemoveError(null)
    startRemoveTransition(async () => {
      const result = await removeBlackoutDate(id)
      if (result?.error) setRemoveError(result.error)
    })
  }

  return (
    <div>
      {initialBlackouts.length > 0 && (
        <ul className="mb-4 space-y-1">
          {initialBlackouts.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <div>
                <span className="text-sm text-gray-900 font-medium">{b.date}</span>
                {b.reason && <span className="ml-2 text-sm text-gray-500">{b.reason}</span>}
              </div>
              <button
                disabled={removeIsPending}
                onClick={() => handleRemove(b.id)}
                className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {removeError && <p className="text-sm text-red-600 mb-3">{removeError}</p>}

      <form action={formAction} className="flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
          <input
            name="date"
            type="date"
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
          <input
            name="reason"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            placeholder="e.g. Public holiday"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Adding…' : 'Add blackout'}
        </button>
        {addState?.error && <p className="text-sm text-red-600">{addState.error}</p>}
      </form>
    </div>
  )
}
