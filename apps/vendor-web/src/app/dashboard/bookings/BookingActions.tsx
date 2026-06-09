'use client'

import { useState, useTransition } from 'react'
import { cancelBooking, completeBooking, noShowBooking } from '@/app/actions/bookings'

interface Props {
  bookingId: string
  status: string
}

export function BookingActions({ bookingId, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error: string } | null>) => {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result?.error) setError(result.error)
    })
  }

  if (status !== 'confirmed' && status !== 'pending_payment') return null

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {status === 'confirmed' && (
        <>
          <button
            disabled={isPending}
            onClick={() => run(() => completeBooking(bookingId))}
            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
          >
            Complete
          </button>
          <button
            disabled={isPending}
            onClick={() => run(() => noShowBooking(bookingId))}
            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            No Show
          </button>
        </>
      )}
      <button
        disabled={isPending}
        onClick={() => run(() => cancelBooking(bookingId))}
        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
