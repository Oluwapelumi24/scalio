import Link from 'next/link'
import { EmptyCalendar, EmptyClients, EmptyInbox } from './visuals'

type Phase = 'setup' | 'review' | 'live'

function phaseFrom(ready: boolean, approved: boolean): Phase {
  if (!ready) return 'setup'
  if (!approved) return 'review'
  return 'live'
}

const CARDS: {
  key: 'inbox' | 'clients' | 'bookings'
  title: string
  href: string
  action: string
  body: Record<Phase, string>
  Illustration: typeof EmptyInbox
  hideFor?: string[]
}[] = [
  {
    key: 'inbox',
    title: 'Recent inbox',
    href: '/dashboard/inbox',
    action: 'Open inbox',
    Illustration: EmptyInbox,
    hideFor: ['practitioner'],
    body: {
      setup: 'Customer messages will land here once you’re taking bookings.',
      review: 'WhatsApp and Instagram chats will show here after you’re live.',
      live: 'No messages yet. New chats from WhatsApp and Instagram appear here.',
    },
  },
  {
    key: 'clients',
    title: 'Recent clients',
    href: '/dashboard/customers',
    action: 'View clients',
    Illustration: EmptyClients,
    hideFor: ['practitioner'],
    body: {
      setup: 'Regulars and favorites build here after their first visit.',
      review: 'Clients appear automatically once bookings start coming in.',
      live: 'No clients yet. They show up after a booking — or book a walk-in.',
    },
  },
  {
    key: 'bookings',
    title: 'Recent bookings',
    href: '/dashboard/bookings',
    action: 'See bookings',
    Illustration: EmptyCalendar,
    body: {
      setup: 'Bookings show up here once customers can book you.',
      review: 'We’ll notify you when you’re live — then new bookings show here.',
      live: 'No upcoming bookings. New ones appear the moment customers book.',
    },
  },
]

function cardHref(
  key: (typeof CARDS)[number]['key'],
  phase: Phase,
  fallback: string,
  role: string,
) {
  if (key === 'bookings' && phase === 'setup') {
    return role === 'owner' || role === 'manager'
      ? '/dashboard/storefront?tab=services'
      : '/dashboard/bookings'
  }
  if (key === 'bookings' && phase === 'live') return '/dashboard/bookings/new'
  return fallback
}

function cardAction(
  key: (typeof CARDS)[number]['key'],
  phase: Phase,
  fallback: string,
  role: string,
) {
  if (key === 'bookings' && phase === 'setup') {
    return role === 'owner' || role === 'manager' ? 'Add a service' : 'See bookings'
  }
  if (key === 'bookings' && phase === 'live') return 'Book a walk-in'
  return fallback
}

/** Three matched empty-state cards when home has nothing recent to show. */
export function ActivityEmptyCards({
  ready,
  approved,
  role,
}: {
  ready: boolean
  approved: boolean
  role: string
}) {
  const phase = phaseFrom(ready, approved)
  const cards = CARDS.filter((card) => !card.hideFor?.includes(role))
  const grid =
    cards.length >= 3 ? 'sm:grid-cols-3' : cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'

  return (
    <ul className={`mt-3 grid gap-3 ${grid}`}>
      {cards.map((card) => {
        const Illustration = card.Illustration
        const href = cardHref(card.key, phase, card.href, role)
        const action = cardAction(card.key, phase, card.action, role)

        return (
          <li key={card.key}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-[20px] border border-[#e4e6eb] bg-white p-5 transition-colors hover:border-[#c9ced8] hover:bg-[#fafbfc]"
            >
              <Illustration className="h-[4.5rem] w-[4.5rem]" />
              <p className="mt-4 text-sm font-semibold text-[#0a0a0a]">{card.title}</p>
              <p className="mt-1.5 flex-1 text-[13px] leading-5 text-[#4a4e57]">{card.body[phase]}</p>
              <span className="mt-3 text-sm font-semibold text-[#1e3a8a] group-hover:underline">
                {action}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
