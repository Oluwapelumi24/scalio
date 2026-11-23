import Link from 'next/link'
import { ApiError, apiFetch } from '@/lib/api'
import { getCustomer, getCustomerToken } from '@/lib/customer-session'
import { formatNaira } from '@/lib/product'

interface BookingRow {
  booking: {
    id: string
    status: string
    amountDueKobo: number
    amountPaidKobo: number
    paymentMode: string
    paystackReference: string | null
  }
  vendor: { businessName: string }
}

export default async function BookingPaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; reference?: string; trxref?: string }>
}) {
  const params = await searchParams
  const bookingId = params.booking?.trim()
  const reference = (params.reference ?? params.trxref)?.trim()
  const user = await getCustomer()

  if (!user) {
    const next = `/app/bookings/return${bookingId ? `?booking=${encodeURIComponent(bookingId)}` : ''}`
    return (
      <ReturnCard
        title="Sign in to finish"
        body="We need your account to confirm this payment."
        primary={{ href: `/app/sign-in?next=${encodeURIComponent(next)}`, label: 'Sign in' }}
      />
    )
  }

  const token = await getCustomerToken()
  if (!token) {
    return (
      <ReturnCard
        title="Sign in again"
        body="Your session expired. Sign in to see whether the payment went through."
        primary={{ href: '/app/sign-in?next=/app/bookings', label: 'Sign in' }}
      />
    )
  }

  let rows: BookingRow[] = []
  try {
    rows = await apiFetch<BookingRow[]>('/bookings', { headers: { Authorization: `Bearer ${token}` } })
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load your booking.'
    return (
      <ReturnCard
        title="Could not confirm payment"
        body={message}
        primary={{ href: '/app/bookings', label: 'See your bookings' }}
      />
    )
  }

  const row =
    rows.find((item) => bookingId && item.booking.id === bookingId) ??
    rows.find((item) => reference && item.booking.paystackReference === reference)

  if (!row) {
    return (
      <ReturnCard
        title="Payment received"
        body="If you paid, it may take a moment to show on your booking. Check your bookings in a few seconds."
        primary={{ href: '/app/bookings', label: 'See your bookings' }}
      />
    )
  }

  const paid = row.booking.amountPaidKobo
  const due = row.booking.amountDueKobo
  const settled = due > 0 && paid >= due

  if (settled) {
    return (
      <ReturnCard
        title="Payment confirmed"
        body={`You paid ${formatNaira(paid)} for ${row.vendor.businessName}. Your booking is set.`}
        primary={{ href: '/app/bookings', label: 'See your bookings' }}
      />
    )
  }

  if (due > 0 && (row.booking.paymentMode === 'deposit' || row.booking.paymentMode === 'full_prepayment')) {
    return (
      <ReturnCard
        title="Payment not finished"
        body={`We have not confirmed ${formatNaira(due)} yet for ${row.vendor.businessName}. You can try again from your bookings.`}
        primary={{ href: '/app/bookings', label: 'Pay from bookings' }}
        secondary={{ href: '/app', label: 'Back to home' }}
      />
    )
  }

  return (
    <ReturnCard
      title="You’re booked"
      body={`${row.vendor.businessName} has your appointment. Pay at the visit if anything is still owed.`}
      primary={{ href: '/app/bookings', label: 'See your bookings' }}
    />
  )
}

function ReturnCard({
  title,
  body,
  primary,
  secondary,
}: {
  title: string
  body: string
  primary: { href: string; label: string }
  secondary?: { href: string; label: string }
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-12 lg:px-10">
      <div className="rounded-[24px] border border-[#e4e6eb] bg-white p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-[#4a4e57]">{body}</p>
        <div className="mt-6 space-y-2">
          <Link
            href={primary.href}
            className="flex h-12 items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="flex h-12 items-center justify-center rounded-full border border-[#c9ced8] text-sm font-semibold"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
