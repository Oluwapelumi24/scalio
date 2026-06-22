'use client'

import { cancelBookingAction, completeBookingAction, noShowBookingAction } from '@/app/actions/vendor-bookings'

export function BookingActions({ vendorId, bookingId, status }: { vendorId: string; bookingId: string; status: string }) {
  if (status !== 'confirmed' && status !== 'pending_payment') return null
  return (
    <div className="flex gap-2 justify-end">
      {status === 'confirmed' && (
        <form action={async () => { await completeBookingAction(vendorId, bookingId) }}>
          <button type="submit" className="text-xs text-green-700 hover:text-green-900 font-medium">Complete</button>
        </form>
      )}
      <form action={async () => { await noShowBookingAction(vendorId, bookingId) }}>
        <button type="submit" className="text-xs text-amber-700 hover:text-amber-900 font-medium">No-show</button>
      </form>
      <form action={async () => { await cancelBookingAction(vendorId, bookingId) }}>
        <button type="submit" className="text-xs text-red-600 hover:text-red-800 font-medium">Cancel</button>
      </form>
    </div>
  )
}
