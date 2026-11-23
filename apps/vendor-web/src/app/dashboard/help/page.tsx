import Link from 'next/link'
import { Icon } from '@/components/Icon'

const TOPICS = [
  {
    title: 'Finish setup',
    body: 'Add a service, set opening hours, and polish your business page so customers can book you.',
    href: '/dashboard/storefront',
    action: 'Open storefront',
  },
  {
    title: 'Take a walk-in',
    body: 'Book someone who arrived without an appointment. They show up in Bookings right away.',
    href: '/dashboard/bookings/new',
    action: 'New booking',
  },
  {
    title: 'Change your password',
    body: 'Email yourself a reset code from Settings, then choose a new password.',
    href: '/dashboard/settings',
    action: 'Open settings',
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Help and support</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#4a4e57]">
          Quick answers for running your business on Veno. Still stuck? Email us and we’ll help.
        </p>
      </div>

      <section className="rounded-[20px] border border-[#e4e6eb] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8edfa] text-[#1e3a8a]">
            <Icon name="message-circle" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#0a0a0a]">Contact support</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#4a4e57]">
              Write to <a href="mailto:support@venohq.com" className="font-semibold text-[#1e3a8a]">support@venohq.com</a>
              {' '}with your business name and what went wrong. We usually reply within one business day.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-bold text-[#0a0a0a]">Common tasks</h2>
        {TOPICS.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            className="flex items-start gap-3 rounded-[20px] border border-[#e4e6eb] bg-white p-4 hover:bg-[#fafbfc]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#0a0a0a]">{topic.title}</span>
              <span className="mt-1 block text-[13px] leading-5 text-[#4a4e57]">{topic.body}</span>
              <span className="mt-2 inline-block text-sm font-semibold text-[#1e3a8a]">{topic.action}</span>
            </span>
            <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-[#c9ced8]" />
          </Link>
        ))}
      </section>
    </div>
  )
}