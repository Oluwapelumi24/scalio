import { redirect } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api'
import { getToken } from '@/lib/session'
import { MANAGER_ROLES, type HomeResponse, type Preferences } from '@/lib/personalisation'
import { Icon } from '@/components/Icon'
import { ModuleLink } from './home/ModuleLink'
import { ShareLink } from './home/ShareLink'
import { BookingLinkCard } from './home/BookingLinkCard'
import { EmptyCalendar, IconTile } from './home/visuals'

interface StaffPrincipal { role: string; name: string }

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

// Where each module leads. Modules without an entry are informational.
const HREF: Record<string, string> = {
  awaiting_payment: '/dashboard/bookings?status=pending_payment',
  starting_soon: '/dashboard/bookings?status=confirmed',
  unassigned_today: '/dashboard/bookings',
  bookings_on_leave: '/dashboard/bookings',
  staff_performance: '/dashboard/performance',
  upcoming_bookings: '/dashboard/bookings',
  view_bookings: '/dashboard/bookings',
  repeat_customers: '/dashboard/customers',
  new_customers: '/dashboard/customers',
  view_customers: '/dashboard/customers',
  follow_up_lapsed: '/dashboard/customers',
  team: '/dashboard/staff',
  manage_team: '/dashboard/staff',
  add_service: '/dashboard/services',
  setup_services: '/dashboard/services',
  business_hours: '/dashboard/schedule',
  setup_hours: '/dashboard/schedule',
  choose_interests: '/dashboard/interests',
  payroll_open: '/dashboard/payroll',
  pay_staff: '/dashboard/payroll',
  setup_payroll: '/dashboard/payroll',
  setup_payments: '/dashboard/payments',
  create_post: '/dashboard/content/new',
  first_post: '/dashboard/content/new',
  posts_planned_today: '/dashboard/content',
  leads_due: '/dashboard/leads',
  unhappy_customers: '/dashboard/feedback',
  customer_rating: '/dashboard/feedback',
  view_reports: '/dashboard/reports',
  deposits_for_no_shows: '/dashboard/services',
  quiet_day_offer: '/dashboard/content/new',
  ask_for_feedback: '/dashboard/bookings?status=completed',
  view_leads: '/dashboard/leads?filter=open',
}

const BOOKING_ALERTS: Record<string, { text: (n: number) => string; action: string }> = {
  awaiting_payment: { text: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`, action: 'View' },
  starting_soon: { text: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`, action: 'View' },
  unassigned_today: { text: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff`, action: 'Assign' },
  bookings_on_leave: { text: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`, action: 'Review' },
}

const ATTENTION_TEXT: Record<string, (n: number, d: Record<string, number>) => string> = {
  awaiting_payment: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`,
  starting_soon: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`,
  unassigned_today: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff assigned`,
  bookings_on_leave: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`,
  payroll_open: (_n, d) => `Payroll is open: ${d.toPay} ${d.toPay === 1 ? 'person' : 'people'} still to pay`,
  unhappy_customers: (n) => `${n} unhappy ${n === 1 ? 'customer' : 'customers'} to call back`,
  leads_due: (n) => `${n} ${n === 1 ? 'lead is' : 'leads are'} waiting for a follow-up`,
  posts_planned_today: (n) => `${n} ${n === 1 ? 'post is' : 'posts are'} planned for today`,
}

const RECOMMENDATION_TEXT: Record<string, (d: Record<string, number> & { day?: string }) => string> = {
  choose_interests: () => 'Pick what you want help with and we will set up your home screen.',
  setup_services: () => 'Customers can only book once you have at least one service.',
  setup_hours: () => 'Let customers know when you are open.',
  setup_payments: () => 'Add your bank account so customers can pay deposits online.',
  setup_payroll: () => 'Set a pay day and salaries so payroll reminds you each month.',
  share_link_first: () => 'Share your booking link on WhatsApp or Instagram.',
  quiet_day_offer: (d) => `${d.day}s get about ${d.bookings} bookings when other days average ${d.averageBookings} (last 8 weeks). Post an offer for that day.`,
  deposits_for_no_shows: (d) => `${d.noShows} no-shows in the last 60 days (${Math.round(d.rate * 100)}% of visits). Ask for a deposit on your busiest services.`,
  ask_for_feedback: (d) => `${d.count} recent ${d.count === 1 ? 'customer has' : 'customers have'} no email. Send them the rating link on WhatsApp from Bookings.`,
  first_post: () => 'Add a photo, say what it is about, and AI writes the caption and hashtags.',
  follow_up_lapsed: (d) => `${d.count} ${d.count === 1 ? 'customer is' : 'customers are'} past their usual return time.`,
}

export default async function DashboardHome() {
  const token = await getToken()
  if (!token) redirect('/login')

  let staff: StaffPrincipal
  try {
    staff = await apiFetch<StaffPrincipal>('/vendor-auth/me', token)
  } catch {
    redirect('/login')
  }

  const isManager = MANAGER_ROLES.includes(staff.role)

  // First visit for an owner or manager: ask what they want help with. Skipping
  // counts as answering, so this only ever happens once.
  if (isManager) {
    const prefs = await apiFetch<Preferences>('/vendor-admin/preferences', token).catch(() => null)
    if (prefs && !prefs.interestsCompletedAt) redirect('/dashboard/interests?welcome=1')
  }

  let home: HomeResponse | null = null
  try {
    home = await apiFetch<HomeResponse>('/vendor-admin/home', token)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
  }

  const bookings = home?.bookings
  const ready = !!bookings && bookings.setup.services && bookings.setup.hours
  const upcomingCount = bookings?.upcoming.length ?? 0
  const summary = !bookings
    ? ''
    : !ready
      ? 'A couple of steps and customers can book you.'
      : upcomingCount === 0
        ? 'No bookings coming up yet.'
        : `You have ${upcomingCount} ${upcomingCount === 1 ? 'booking' : 'bookings'} coming up.`
  const alerts = home?.layers.attention.filter((item) => item.id in BOOKING_ALERTS) ?? []
  const otherAttention = home?.layers.attention.filter((item) => !(item.id in BOOKING_ALERTS)) ?? []
  const steps = bookings
    ? [
        { key: 'services', label: 'Add a service', hint: 'Customers pick one when they book', done: bookings.setup.services, href: '/dashboard/services', icon: 'plus-circle' },
        { key: 'hours', label: 'Set your opening hours', hint: 'So customers only book when you’re open', done: bookings.setup.hours, href: '/dashboard/schedule', icon: 'clock' },
        ...(isManager
          ? [{ key: 'payments', label: 'Take deposits online', hint: 'Optional — cuts no-shows', done: bookings.setup.payments, href: '/dashboard/payments', icon: 'credit-card' }]
          : []),
      ]
    : []
  const shareAlreadyShown = home?.layers.recommendation.some((item) => item.id === 'share_link_first') ?? false
  const quickActions = (home?.layers.quick_action ?? []).filter((item) => {
    if (item.id !== 'share_booking_link') return true
    return !ready && !shareAlreadyShown
  })

  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      <div className="rounded-[28px] bg-gradient-to-b from-[#e8edfa] to-transparent px-1 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold tracking-tight">Hey, {staff.name.split(' ')[0] || 'there'}</h1>
          {isManager && (
            <Link href="/dashboard/customise" className="text-sm font-semibold text-[#1e3a8a]">
              Customise home
            </Link>
          )}
        </div>
        {summary ? <p className="mt-4 text-sm font-medium text-[#4a4e57]">{summary}</p> : null}
      </div>

      {!home || !bookings ? (
        <div className="mt-4 rounded-[20px] border border-[#e4e6eb] bg-white p-8 text-center">
          <p className="text-[#4a4e57]">We couldn&apos;t load your bookings.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-[#1e3a8a]">Try again</Link>
        </div>
      ) : (
        <>
        <div className="mt-2 grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            {ready ? (
              <BookingLinkCard url={bookings.link} total={bookings.total} />
            ) : (
              <section className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-bold">Start taking bookings</h2>
                  <p className="shrink-0 text-xs font-semibold text-[#7d818b]">
                    {steps.filter((step) => step.done).length} of {steps.length}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e4e6eb]">
                  <div
                    className="h-full rounded-full bg-[#1e3a8a]"
                    style={{ width: `${(steps.filter((step) => step.done).length / steps.length) * 100}%` }}
                  />
                </div>
                <ul className="mt-3 divide-y divide-[#e4e6eb] rounded-[20px] border border-[#e4e6eb] bg-white px-4">
                  {steps.map((step) => (
                    <li key={step.key}>
                      {step.done ? (
                        <div className="flex items-center gap-3 py-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f6ee] text-[#166534]">
                            <Icon name="check" className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[#7d818b] line-through">{step.label}</span>
                            <span className="text-[13px] text-[#7d818b]">{step.hint}</span>
                          </span>
                        </div>
                      ) : (
                        <Link href={step.href} className="flex items-center gap-3 py-4">
                          <IconTile name={step.icon} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{step.label}</span>
                            <span className="text-[13px] leading-5 text-[#4a4e57]">{step.hint}</span>
                          </span>
                          <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {alerts.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold">Needs your attention</h2>
                <ul className="mt-3 divide-y divide-[#e4e6eb] rounded-[20px] border border-[#e4e6eb] bg-white px-4">
                  {alerts.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-4">
                      <IconTile name={item.icon} className="h-9 w-9 rounded-xl" />
                      <span className="min-w-0 flex-1 text-sm leading-5">{BOOKING_ALERTS[item.id].text(item.data.count)}</span>
                      <ModuleLink moduleId={item.id} href="/dashboard/bookings" className="shrink-0 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-xs font-semibold text-white">
                        {BOOKING_ALERTS[item.id].action}
                      </ModuleLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[15px] font-bold">Up next</h2>
                <Link href="/dashboard/bookings" className="shrink-0 text-[13px] font-semibold text-[#1e3a8a]">See all</Link>
              </div>
              <ul className="mt-3 divide-y divide-[#e4e6eb] overflow-hidden rounded-[20px] border border-[#e4e6eb] bg-white px-4">
                {bookings.upcoming.length === 0 ? (
                  <li className="flex items-center gap-3 py-5">
                    <EmptyCalendar />
                    <p className="min-w-0 text-sm leading-5 text-[#4a4e57]">
                      {ready ? 'New bookings show up here as soon as customers make them.' : 'Bookings show up here once customers can book you.'}
                    </p>
                  </li>
                ) : (
                  bookings.upcoming.map((booking) => (
                    <li key={booking.id}>
                      <Link href="/dashboard/bookings" className="flex items-center gap-3 py-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8edfa] text-sm font-semibold text-[#1e3a8a]">
                          {(booking.customerName ?? 'C').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{booking.customerName ?? 'Customer'}</span>
                          <span className="text-[13px] text-[#4a4e57]">
                            {formatWhen(booking.scheduledAt)}
                            {booking.status === 'pending_payment' ? ' · awaiting payment' : ''}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <aside className="min-w-0 space-y-8">
            {otherAttention.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold">Other updates</h2>
                <div className="mt-3 space-y-2">
                  {otherAttention.map((item) => (
                    <ModuleLink
                      key={item.id}
                      moduleId={item.id}
                      href={HREF[item.id] ?? '/dashboard'}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-3.5 text-sm"
                    >
                      <IconTile name={item.icon} />
                      <span className="min-w-0 flex-1 leading-5">{ATTENTION_TEXT[item.id]?.(item.data.count, item.data) ?? item.title}</span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
                    </ModuleLink>
                  ))}
                </div>
              </section>
            )}

            {home.layers.recommendation.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold">Suggested for you</h2>
                <div className="mt-3 space-y-2">
                  {home.layers.recommendation.map((item) => {
                    if (item.status === 'coming_soon') {
                      return (
                        <div key={item.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-[#c9ced8] bg-white p-3.5">
                          <IconTile name={item.icon} />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{item.title}</span>
                            <span className="mt-0.5 block text-[13px] leading-5 text-[#7d818b]">Coming soon. We&apos;ll let you know when it&apos;s ready.</span>
                          </span>
                        </div>
                      )
                    }
                    if (item.id === 'share_link_first') {
                      return (
                        <ShareLink
                          key={item.id}
                          moduleId={item.id}
                          url={item.data.url}
                          title={item.title}
                          body={RECOMMENDATION_TEXT[item.id]?.(item.data)}
                        />
                      )
                    }
                    return (
                      <ModuleLink
                        key={item.id}
                        moduleId={item.id}
                        href={HREF[item.id] ?? '/dashboard'}
                        className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-3.5"
                      >
                        <IconTile name={item.icon} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{item.title}</span>
                          <span className="mt-0.5 block text-[13px] leading-5 text-[#4a4e57]">{RECOMMENDATION_TEXT[item.id]?.(item.data) ?? ''}</span>
                        </span>
                        <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-[#c9ced8]" />
                      </ModuleLink>
                    )
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>

        {quickActions.length > 0 && (
          <section className="mt-8 min-w-0">
            <h2 className="text-[15px] font-bold">Quick actions</h2>
            <div className="mt-3 space-y-2">
              {quickActions.filter((item) => item.id === 'share_booking_link').map((item) => (
                <ShareLink key={item.id} moduleId={item.id} url={item.data.url} title={item.title} />
              ))}
              {quickActions.some((item) => item.id !== 'share_booking_link') && (
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
                  {quickActions.filter((item) => item.id !== 'share_booking_link').map((item) => (
                    <ModuleLink
                      key={item.id}
                      moduleId={item.id}
                      href={HREF[item.id] ?? '/dashboard'}
                      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-3.5 transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
                    >
                      <IconTile name={item.icon} />
                      <span className="text-sm font-semibold leading-5">{item.title}</span>
                    </ModuleLink>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        </>
      )}
    </div>
  )
}
