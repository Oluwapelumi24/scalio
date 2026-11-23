'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cancelBooking, startPayment } from '@/app/actions/customer'
import { formatNaira, type ListedVendor } from '@/lib/product'
import type { PaymentMode } from '@/lib/payments'

interface BookingRow {
  booking: {
    id: string
    status: string
    scheduledAt: string
    paymentMode?: PaymentMode
    amountDueKobo?: number
    amountPaidKobo?: number
  }
  vendor: Pick<ListedVendor, 'id' | 'businessName' | 'logoUrl' | 'category'>
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

type Tab = (typeof TABS)[number]['key']

const UPCOMING = new Set(['pending_payment', 'confirmed'])
const COMPLETED = new Set(['completed'])
const CANCELLED = new Set(['cancelled_by_customer', 'cancelled_by_vendor', 'no_show'])

const STATUS: Record<string, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_vendor: 'Cancelled by business',
  no_show: 'No-show',
}

const EMPTY: Record<Tab, { title: string; body?: string; cta?: { href: string; label: string } }> = {
  upcoming: {
    title: 'No upcoming bookings',
    body: 'Find a business and book a time that is free.',
    cta: { href: '/app', label: 'Book a service' },
  },
  completed: { title: 'No completed bookings yet' },
  cancelled: { title: 'No cancelled bookings' },
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function owing(booking: BookingRow['booking']) {
  const due = booking.amountDueKobo ?? 0
  const paid = booking.amountPaidKobo ?? 0
  const mode = booking.paymentMode
  if (mode !== 'deposit' && mode !== 'full_prepayment') {
    return booking.status === 'pending_payment' ? due : 0
  }
  return Math.max(0, due - paid)
}

export function BookingList({ bookings }: { bookings: BookingRow[] }) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const rows = bookings.filter((row) => {
    if (tab === 'upcoming') return UPCOMING.has(row.booking.status)
    if (tab === 'completed') return COMPLETED.has(row.booking.status)
    return CANCELLED.has(row.booking.status)
  })
  const empty = EMPTY[tab]

  function payNow(row: BookingRow) {
    const mode = row.booking.paymentMode
    const amount = owing(row.booking)
    if ((mode !== 'deposit' && mode !== 'full_prepayment') || amount <= 0) {
      setError('This booking cannot be paid online right now.')
      return
    }
    setError(null)
    setPaying(row.booking.id)
    startTransition(async () => {
      const result = await startPayment(row.booking.id, mode, amount)
      if (result.error || !result.authorizationUrl) {
        setError(result.error ?? 'Could not open checkout.')
        setPaying(null)
        return
      }
      window.location.href = result.authorizationUrl
    })
  }

  return (
    <div>
      <div className="mt-6 flex gap-6 border-b border-[#e4e6eb]">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`border-b-2 pb-3 text-sm font-semibold ${tab === item.key ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-[#4a4e57]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-[#dc2626]">{error}</p> : null}
      {rows.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-[#e4e6eb] px-6 py-10 text-center">
          <p className="font-semibold">{empty.title}</p>
          {empty.body ? <p className="mt-1 text-sm text-[#4a4e57]">{empty.body}</p> : null}
          {empty.cta ? (
            <Link
              href={empty.cta.href}
              className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#1e3a8a] px-5 text-sm font-semibold text-white"
            >
              {empty.cta.label}
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {rows.map((row) => {
            const due = owing(row.booking)
            const canPay = due > 0 && (row.booking.paymentMode === 'deposit' || row.booking.paymentMode === 'full_prepayment')
            return (
              <li key={row.booking.id} className="flex items-center gap-4 rounded-[20px] border border-[#e4e6eb] p-3 pr-4">
                {row.vendor.logoUrl ? (
                  <img src={row.vendor.logoUrl} alt="" className="h-[72px] w-[72px] rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#e8edfa] text-sm font-semibold text-[#1e3a8a]">
                    {row.vendor.businessName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.vendor.businessName}</p>
                  <p className="text-[13px] text-[#4a4e57]">{when(row.booking.scheduledAt)}</p>
                  <p className="text-[13px] font-semibold text-[#1e3a8a]">
                    {canPay ? `Pay ${formatNaira(due)}` : STATUS[row.booking.status] ?? row.booking.status}
                  </p>
                </div>
                {tab === 'upcoming' ? (
                  confirming === row.booking.id ? (
                    <span className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setError(null)
                          startTransition(async () => {
                            const result = await cancelBooking(row.booking.id)
                            if (result.error) setError(result.error)
                            else router.refresh()
                            setConfirming(null)
                          })
                        }}
                        className="h-9 rounded-full bg-[#dc2626] px-3 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {pending ? 'Cancelling…' : 'Confirm'}
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="h-9 rounded-full border border-[#c9ced8] px-3 text-xs font-semibold">
                        Keep
                      </button>
                    </span>
                  ) : (
                    <span className="flex shrink-0 flex-col gap-1">
                      {canPay ? (
                        <button
                          type="button"
                          disabled={pending && paying === row.booking.id}
                          onClick={() => payNow(row)}
                          className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[#1e3a8a] px-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {pending && paying === row.booking.id ? 'Opening…' : 'Pay now'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setConfirming(row.booking.id)}
                        className="inline-flex h-12 items-center justify-center rounded-[20px] border border-[#c9ced8] px-3 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </span>
                  )
                ) : (
                  <Link href={`/app/business/${row.vendor.id}`} className="inline-flex h-12 shrink-0 items-center rounded-[20px] border border-[#c9ced8] px-3 text-sm font-semibold">
                    Rebook
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
