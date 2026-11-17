import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MarkRead } from './MarkRead'

interface VendorNotification {
  id: string
  type: 'booking_new' | 'booking_cancelled' | 'payment_received' | 'review' | 'inbox_handoff'
  title: string
  body: string
  bookingId: string | null
  conversationId: string | null
  createdAt: string
  unread: boolean
}

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  if (hours < 48) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function destination(item: VendorNotification): string | null {
  if (item.conversationId) return `/dashboard/inbox?c=${item.conversationId}`
  if (item.type === 'review') return '/dashboard/feedback'
  if (item.bookingId) return '/dashboard/bookings'
  return null
}

export default async function NotificationsPage() {
  const token = await requireToken()
  const feed = await apiFetch<{ unread: number; items: VendorNotification[] }>('/vendor-admin/notifications', token)
    .catch(() => ({ unread: 0, items: [] as VendorNotification[] }))

  return (
    <div className="mx-auto max-w-2xl">
      <MarkRead unread={feed.unread} />
      <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Notifications</h1>
      <p className="mt-1 text-sm text-[#4a4e57]">
        New bookings, cancellations, payments, ratings and chats that need you.
      </p>

      {feed.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#e4e6eb] bg-white px-4 py-10 text-center">
          <p className="text-sm font-semibold">Nothing yet</p>
          <p className="mt-1 text-sm text-[#7d818b]">When a client books, cancels, pays or rates a visit, it shows up here.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[#e4e6eb] overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white">
          {feed.items.map((item) => {
            const href = destination(item)
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-3">
                    <span className={`truncate text-sm ${item.unread ? 'font-bold' : 'font-semibold'}`}>{item.title}</span>
                    <span className="shrink-0 text-xs text-[#7d818b]">{ago(item.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm leading-5 text-[#4a4e57]">{item.body}</span>
                </span>
                {item.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1e3a8a]" aria-hidden /> : null}
              </>
            )
            return (
              <li key={item.id}>
                {href ? (
                  <Link href={href} className="flex items-start gap-3 px-4 py-3.5">
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 px-4 py-3.5">{row}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
