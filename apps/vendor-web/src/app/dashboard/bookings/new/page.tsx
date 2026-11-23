import Link from 'next/link'
import { NewBookingForm } from './NewBookingForm'
import { loadBookingFormOptions } from './load-booking-form'

/** Hard refresh / direct URL fallback when the intercept modal isn’t available. */
export default async function NewBookingPage() {
  const options = await loadBookingFormOptions()

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/bookings" className="text-sm font-semibold text-[#1e3a8a]">
          ← Bookings
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0a0a0a]">New booking</h1>
        <p className="mt-1 text-sm leading-6 text-[#4a4e57]">
          Book a walk-in, phone call or DM — same as customers booking themselves online.
        </p>
      </div>
      <NewBookingForm {...options} />
    </div>
  )
}
