import Link from 'next/link'
import { ApiError, apiFetch } from '@/lib/api'
import { getCustomer, getCustomerToken } from '@/lib/customer-session'
import { BookingList } from '@/components/product/BookingList'
import type { ListedVendor } from '@/lib/product'

interface BookingRow {
  booking: { id: string; status: string; scheduledAt: string }
  vendor: Pick<ListedVendor, 'id' | 'businessName' | 'logoUrl' | 'category'>
}

export default async function BookingsPage() {
  const user = await getCustomer()

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-[#4a4e57]">Your upcoming visits and booking history.</p>
      {!user ? (
        <div className="mt-8 max-w-md rounded-[20px] border border-[#e4e6eb] px-6 py-10">
          <p className="font-semibold">Sign in to see your bookings</p>
          <p className="mt-1 text-sm text-[#4a4e57]">Your appointments and history will show here.</p>
          <Link href="/app/sign-in?next=/app/bookings" className="mt-5 inline-flex items-center rounded-[20px] bg-[#1e3a8a] px-5 text-sm font-semibold text-white h-12">
            Sign in
          </Link>
        </div>
      ) : (
        <SignedInBookings />
      )}
    </div>
  )
}

async function SignedInBookings() {
  const token = await getCustomerToken()
  if (!token) return <p className="mt-8 text-sm text-[#4a4e57]">Sign in again to see your appointments.</p>
  try {
    const bookings = await apiFetch<BookingRow[]>('/bookings', { headers: { Authorization: `Bearer ${token}` } })
    return <BookingList bookings={bookings} />
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load your appointments.'
    return <p className="mt-8 text-sm text-[#dc2626]">{message}</p>
  }
}
