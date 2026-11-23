import { NewBookingModal } from '@/app/dashboard/bookings/new/NewBookingModal'
import { loadBookingFormOptions } from '@/app/dashboard/bookings/new/load-booking-form'

/** Soft-nav intercept: /dashboard/bookings/new opens as a popup over the current page. */
export default async function InterceptedNewBookingPage() {
  const options = await loadBookingFormOptions()
  return <NewBookingModal {...options} />
}
