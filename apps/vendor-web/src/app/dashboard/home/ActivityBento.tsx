import type { ReactNode } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import type { InboxConversation } from '@/lib/inbox'
import { EmptyCalendar, EmptyClients, EmptyInbox } from './visuals'

type Phase = 'setup' | 'review' | 'live'

export interface BentoClient {
  id: string
  name: string
  lastVisitAt: string | null
}

export interface BentoBooking {
  id: string
  customerName: string | null
  scheduledAt: string
  status: string
}

const CHANNEL: Record<InboxConversation['channel'], string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
}

function phaseFrom(ready: boolean, approved: boolean): Phase {
  if (!ready) return 'setup'
  if (!approved) return 'review'
  return 'live'
}

function when(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function visit(iso: string | null) {
  if (!iso) return 'No visit yet'
  return `Last visit ${new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`
}

function initial(name: string) {
  return (name.trim().charAt(0) || '?').toUpperCase()
}

function Tile({
  title,
  href,
  seeAll,
  span,
  children,
}: {
  title: string
  href: string
  seeAll: string
  span: string
  children: ReactNode
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-[24px] border border-[#e4e6eb] bg-white p-4 sm:p-5 ${span}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-[#0a0a0a]">{title}</h2>
        <Link href={href} className="shrink-0 text-[13px] font-semibold text-[#1e3a8a]">
          {seeAll}
        </Link>
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </section>
  )
}

function Row({
  href,
  avatar,
  title,
  meta,
  badge,
}: {
  href: string
  avatar: string
  title: string
  meta: string
  badge?: string
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-[#f5f6f8]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfa] text-xs font-semibold text-[#1e3a8a]">
          {avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#0a0a0a]">{title}</span>
          <span className="block truncate text-[13px] leading-5 text-[#4a4e57]">{meta}</span>
        </span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-[#1e3a8a] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : (
          <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
        )}
      </Link>
    </li>
  )
}

function EmptyBody({
  art,
  body,
  href,
  action,
}: {
  art: ReactNode
  body: string
  href: string
  action: string
}) {
  return (
    <div className="flex h-full flex-col justify-center py-2">
      {art}
      <p className="mt-3 text-[13px] leading-5 text-[#4a4e57]">{body}</p>
      <Link href={href} className="mt-2 text-sm font-semibold text-[#1e3a8a]">
        {action}
      </Link>
    </div>
  )
}

/** Bento of the five most recent inbox chats, clients, and bookings. */
export function ActivityBento({
  role,
  ready,
  approved,
  bookings,
  chats,
  clients,
}: {
  role: string
  ready: boolean
  approved: boolean
  bookings: BentoBooking[]
  chats: InboxConversation[]
  clients: BentoClient[]
}) {
  const phase = phaseFrom(ready, approved)
  const people = role !== 'practitioner'
  const bookingHref =
    phase === 'setup' && (role === 'owner' || role === 'manager')
      ? '/dashboard/storefront?tab=services'
      : phase === 'live'
        ? '/dashboard/bookings/new'
        : '/dashboard/bookings'
  const bookingAction =
    phase === 'setup' && (role === 'owner' || role === 'manager')
      ? 'Add a service'
      : phase === 'live'
        ? 'Book a walk-in'
        : 'See bookings'
  const bookingCopy = {
    setup: 'Bookings show up here once customers can book you.',
    review: 'We’ll notify you when you’re live — then new bookings show here.',
    live: 'No upcoming bookings. New ones appear the moment customers book.',
  }[phase]

  const bookingSpan = people ? 'lg:col-span-6' : 'lg:col-span-12'
  const sideSpan = 'lg:col-span-3'

  return (
    <div className="grid items-stretch gap-3 lg:grid-cols-12">
      <Tile title="Recent bookings" href="/dashboard/bookings" seeAll="See all" span={bookingSpan}>
        {bookings.length === 0 ? (
          <EmptyBody
            art={<EmptyCalendar className="h-14 w-14" />}
            body={bookingCopy}
            href={bookingHref}
            action={bookingAction}
          />
        ) : (
          <ul className="divide-y divide-[#f0f1f4]">
            {bookings.slice(0, 5).map((booking) => (
              <Row
                key={booking.id}
                href="/dashboard/bookings"
                avatar={initial(booking.customerName ?? 'C')}
                title={booking.customerName ?? 'Customer'}
                meta={`${when(booking.scheduledAt)}${booking.status === 'pending_payment' ? ' · awaiting payment' : ''}`}
              />
            ))}
          </ul>
        )}
      </Tile>

      {people ? (
        <Tile title="Recent inbox" href="/dashboard/inbox" seeAll="Open" span={sideSpan}>
          {chats.length === 0 ? (
            <EmptyBody
              art={<EmptyInbox className="h-14 w-14" />}
              body={
                phase === 'live'
                  ? 'No messages yet. WhatsApp and Instagram chats appear here.'
                  : 'Chats show here after you’re live.'
              }
              href="/dashboard/inbox"
              action="Open inbox"
            />
          ) : (
            <ul className="divide-y divide-[#f0f1f4]">
              {chats.slice(0, 5).map((chat) => (
                <Row
                  key={chat.id}
                  href={`/dashboard/inbox?c=${chat.id}`}
                  avatar={initial(chat.customerName)}
                  title={chat.customerName}
                  meta={chat.preview?.trim() || CHANNEL[chat.channel]}
                  badge={chat.unreadCount > 0 ? (chat.unreadCount > 9 ? '9+' : String(chat.unreadCount)) : undefined}
                />
              ))}
            </ul>
          )}
        </Tile>
      ) : null}

      {people ? (
        <Tile title="Recent clients" href="/dashboard/customers" seeAll="View" span={sideSpan}>
          {clients.length === 0 ? (
            <EmptyBody
              art={<EmptyClients className="h-14 w-14" />}
              body={
                phase === 'live'
                  ? 'No clients yet. They appear after the first booking.'
                  : 'Clients appear automatically once bookings start.'
              }
              href="/dashboard/customers"
              action="View clients"
            />
          ) : (
            <ul className="divide-y divide-[#f0f1f4]">
              {clients.slice(0, 5).map((client) => (
                <Row
                  key={client.id}
                  href={`/dashboard/customers/${client.id}`}
                  avatar={initial(client.name)}
                  title={client.name}
                  meta={visit(client.lastVisitAt)}
                />
              ))}
            </ul>
          )}
        </Tile>
      ) : null}
    </div>
  )
}
