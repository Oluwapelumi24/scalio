import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import {
  notificationAgo,
  notificationHref,
  type VendorNotification,
} from '@/lib/notifications'
import { EmptyState } from '../EmptyState'
import { IconTile } from '../home/visuals'
import { MarkRead } from './MarkRead'

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
        <div className="mt-6">
          <EmptyState
            art={<IconTile name="bell" className="mx-auto h-14 w-14" />}
            title="Nothing yet"
            body="When a client books, cancels, pays or rates a visit, it shows up here."
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[#e4e6eb] overflow-hidden rounded-2xl bg-white">
          {feed.items.map((item) => {
            const href = notificationHref(item)
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-3">
                    <span className={`truncate text-sm ${item.unread ? 'font-bold' : 'font-semibold'} text-[#0a0a0a]`}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs text-[#7d818b]">{notificationAgo(item.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm leading-5 text-[#4a4e57]">{item.body}</span>
                </span>
                {item.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1e3a8a]" aria-hidden /> : null}
              </>
            )
            return (
              <li key={item.id}>
                {href ? (
                  <Link href={href} className="flex items-start gap-3 px-4 py-3.5 hover:bg-[#fafbfc]">
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
