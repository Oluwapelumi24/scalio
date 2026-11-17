'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ListedVendor } from '@/lib/product'

interface BookingRow {
  booking: {
    id: string
    status: string
    scheduledAt: string
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

const EMPTY: Record<Tab, { title: string; body?: string }> = {
  upcoming: { title: 'No upcoming bookings', body: 'Book one from the home screen.' },
  completed: { title: 'No completed bookings yet' },
  cancelled: { title: 'No cancelled bookings' },
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function BookingList({ bookings }: { bookings: BookingRow[] }) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const rows = bookings.filter((row) => {
    if (tab === 'upcoming') return UPCOMING.has(row.booking.status)
    if (tab === 'completed') return COMPLETED.has(row.booking.status)
    return CANCELLED.has(row.booking.status)
  })
  const empty = EMPTY[tab]

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
      {rows.length === 0 ? (
        <div className="mt-8 rounded-[20px] border border-[#e4e6eb] px-6 py-10 text-center">
          <p className="font-semibold">{empty.title}</p>
          {empty.body ? <p className="mt-1 text-sm text-[#4a4e57]">{empty.body}</p> : null}
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
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
                <p className="text-[13px] font-semibold text-[#1e3a8a]">{STATUS[row.booking.status] ?? row.booking.status}</p>
              </div>
              {tab !== 'upcoming' ? (
                <Link href={`/app/business/${row.vendor.id}`} className="rounded-[20px] border border-[#c9ced8] px-3 text-sm font-semibold h-12 inline-flex items-center">
                  Rebook
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
