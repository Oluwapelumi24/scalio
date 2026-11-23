import Link from 'next/link'

export interface TodayStatsData {
  bookings: number
  upcoming: number
  awaitingPayment: number
  salesKobo: number | null
}

function money(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

/** Industry-style day snapshot: expected guests, pipeline, and sales. */
export function TodayStats({ data }: { data: TodayStatsData }) {
  const cells = [
    {
      label: 'Expected today',
      value: String(data.bookings),
      hint: 'Guests on today’s book',
      href: '/dashboard/bookings',
    },
    {
      label: 'Upcoming',
      value: String(data.upcoming),
      hint: 'Still ahead',
      href: '/dashboard/bookings?status=confirmed',
    },
    {
      label: 'Awaiting payment',
      value: String(data.awaitingPayment),
      hint: 'Deposits unpaid',
      href: '/dashboard/bookings?status=pending_payment',
    },
    ...(data.salesKobo != null
      ? [
          {
            label: 'Today’s sales',
            value: money(data.salesKobo),
            hint: 'Completed visits',
            href: '/dashboard/bookings?status=completed',
          },
        ]
      : []),
  ]

  return (
    <section className={`grid overflow-hidden rounded-[20px] border border-[#e4e6eb] bg-white divide-x divide-[#e4e6eb] ${cells.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
      {cells.map((cell) => (
        <Link key={cell.label} href={cell.href} className="block px-4 py-4 hover:bg-[#fafbfc]">
          <p className="truncate text-xl font-bold leading-none text-[#0a0a0a] tabular-nums">{cell.value}</p>
          <p className="mt-1.5 text-sm font-semibold text-[#0a0a0a]">{cell.label}</p>
          <p className="mt-0.5 text-[12px] text-[#7d818b]">{cell.hint}</p>
        </Link>
      ))}
    </section>
  )
}
