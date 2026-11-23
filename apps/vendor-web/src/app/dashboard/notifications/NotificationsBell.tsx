'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { listNotifications, markNotificationsRead } from '@/app/actions/notifications'
import { Icon } from '@/components/Icon'
import {
  notificationAgo,
  notificationHref,
  type VendorNotification,
} from '@/lib/notifications'
import { IconTile } from '../home/visuals'

const PREVIEW = 8

/** Bell opens a panel; full feed stays on /dashboard/notifications via View all. */
export function NotificationsBell({ unread: initialUnread }: { unread: number }) {
  const [open, setOpen] = useState(false)
  const [badge, setBadge] = useState(initialUnread)
  const [items, setItems] = useState<VendorNotification[] | null>(null)
  const [pending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    setBadge(initialUnread)
  }, [initialUnread])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (!next) return

    setItems(null)
    startTransition(async () => {
      try {
        const feed = await listNotifications()
        setItems(feed.items)
        if (feed.unread > 0) {
          setBadge(0)
          void markNotificationsRead()
        }
      } catch {
        setItems([])
      }
    })
  }

  const preview = items?.slice(0, PREVIEW) ?? null

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? titleId : undefined}
        aria-label={badge > 0 ? `Notifications, ${badge} new` : 'Notifications'}
        onClick={toggle}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[#0a0a0a] hover:bg-[#f5f6f8] ${
          open ? 'bg-[#f5f6f8]' : ''
        }`}
      >
        <Icon name="bell" className="h-5 w-5" />
        {badge > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c2410c] px-1 text-[10px] font-bold leading-none text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="absolute right-0 top-12 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#e4e6eb] px-4 py-3">
            <h2 id={titleId} className="text-sm font-bold text-[#0a0a0a]">
              Notifications
            </h2>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium text-[#4a4e57] hover:text-[#0a0a0a]"
            >
              View all
            </Link>
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
            {pending && items === null ? (
              <p className="px-4 py-8 text-center text-sm text-[#7d818b]">Loading…</p>
            ) : preview && preview.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <IconTile name="bell" className="h-12 w-12" />
                <p className="mt-3 text-sm font-semibold text-[#0a0a0a]">Nothing yet</p>
                <p className="mt-1 text-[13px] leading-5 text-[#7d818b]">
                  Bookings, payments, and chats show up here.
                </p>
              </div>
            ) : preview ? (
              <ul className="divide-y divide-[#f0f1f4]">
                {preview.map((item) => {
                  const href = notificationHref(item)
                  const body = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span
                            className={`truncate text-sm ${item.unread ? 'font-bold text-[#0a0a0a]' : 'font-medium text-[#0a0a0a]'}`}
                          >
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-[#7d818b]">
                            {notificationAgo(item.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-[13px] leading-5 text-[#7d818b]">
                          {item.body}
                        </span>
                      </span>
                      {item.unread ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1e3a8a]" aria-hidden />
                      ) : null}
                    </>
                  )
                  return (
                    <li key={item.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-[#fafbfc]"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3">{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          {preview && preview.length > 0 ? (
            <div className="border-t border-[#e4e6eb] px-4 py-2.5">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-[13px] font-medium text-[#4a4e57] hover:text-[#0a0a0a]"
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
