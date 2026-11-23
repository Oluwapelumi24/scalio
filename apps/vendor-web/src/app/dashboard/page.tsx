import { redirect } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api'
import { getToken } from '@/lib/session'
import { listingReady, type VendorProfile } from '@/lib/categories'
import { MANAGER_ROLES, type HomeResponse } from '@/lib/personalisation'
import { Icon } from '@/components/Icon'
import { ModuleLink } from './home/ModuleLink'
import { ShareLink } from './home/ShareLink'
import { BookingLinkCard } from './home/BookingLinkCard'
import { ActivityBento, type BentoClient } from './home/ActivityBento'
import { IconTile } from './home/visuals'
import type { InboxConversation } from '@/lib/inbox'

interface StaffPrincipal { role: string; name: string }

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
  team: '/dashboard/storefront?tab=team',
  manage_team: '/dashboard/storefront?tab=team',
  add_service: '/dashboard/storefront?tab=services',
  setup_services: '/dashboard/storefront?tab=services',
  business_hours: '/dashboard/storefront?tab=hours',
  setup_hours: '/dashboard/storefront?tab=hours',
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
  deposits_for_no_shows: '/dashboard/storefront?tab=services',
  quiet_day_offer: '/dashboard/content/new',
  ask_for_feedback: '/dashboard/bookings?status=completed',
  view_leads: '/dashboard/leads?filter=open',
  try_ads: '/dashboard/ads',
  open_inbox: '/dashboard/inbox',
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
  try_ads: () => 'Reach more customers near you with Facebook and Instagram ads.',
  open_inbox: () => 'Reply to WhatsApp and Instagram messages in one place.',
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

  let home: HomeResponse | null = null
  try {
    home = await apiFetch<HomeResponse>('/vendor-admin/home', token)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
  }
  const canSeePeople = staff.role !== 'practitioner'
  const [profile, recentClients, recentChats] = await Promise.all([
    apiFetch<VendorProfile>('/vendor-admin/profile', token).catch(() => null),
    canSeePeople
      ? apiFetch<BentoClient[]>('/vendor-admin/customers', token).then((rows) => rows.slice(0, 5)).catch(() => [] as BentoClient[])
      : Promise.resolve([] as BentoClient[]),
    canSeePeople
      ? apiFetch<InboxConversation[]>('/vendor-admin/inbox/conversations?filter=all', token)
          .then((rows) => rows.slice(0, 5))
          .catch(() => [] as InboxConversation[])
      : Promise.resolve([] as InboxConversation[]),
  ])
  const listed = profile ? listingReady(profile) : true
  const approved = profile?.approvalStatus === 'approved'

  const bookings = home?.bookings
  const ready = !!bookings && bookings.setup.services && bookings.setup.hours && listed
  const upcomingCount = bookings?.upcoming.length ?? 0
  // Approval status lives in the layout banner — keep the greeting to the job in front of them.
  const summary = !bookings
    ? ''
    : !ready
      ? 'Add a service and your opening hours to finish setup.'
      : upcomingCount === 0
        ? 'No bookings coming up yet.'
        : `You have ${upcomingCount} ${upcomingCount === 1 ? 'booking' : 'bookings'} coming up.`
  const alerts = home?.layers.attention.filter((item) => item.id in BOOKING_ALERTS) ?? []
  const otherAttention = home?.layers.attention.filter((item) => !(item.id in BOOKING_ALERTS)) ?? []
  const steps = bookings
    ? [
        ...(profile
          ? [{ key: 'listing', label: 'Say what you do and where', hint: 'So customers can find you in search', done: listed, href: '/dashboard/storefront?tab=page', icon: 'map-pin' }]
          : []),
        { key: 'services', label: 'Add a service', hint: 'Customers pick one when they book', done: bookings.setup.services, href: '/dashboard/storefront?tab=services', icon: 'plus-circle' },
        { key: 'hours', label: 'Set your opening hours', hint: 'So customers only book when you’re open', done: bookings.setup.hours, href: '/dashboard/storefront?tab=hours', icon: 'clock' },
        ...(isManager
          ? [{ key: 'payments', label: 'Take deposits online', hint: 'Optional — cuts no-shows', done: bookings.setup.payments, href: '/dashboard/payments', icon: 'credit-card' }]
          : []),
      ]
    : []
  const activated = ready && approved
  // During setup / review: Suggested only (max 3). Quick actions after the listing is live.
  const suggestions = (home?.layers.recommendation ?? [])
    .filter((item) => {
      if (item.id === 'share_link_first' && !approved) return false
      if (item.status === 'coming_soon' && !activated) return false
      // Checklist already covers these while setup is incomplete.
      if (!ready && (item.id === 'setup_services' || item.id === 'setup_hours')) return false
      return true
    })
    .slice(0, 3)
  const quickActions = activated
    ? (home?.layers.quick_action ?? []).filter((item) => item.id !== 'share_booking_link' || approved)
    : []

  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      <section className="rounded-[24px] bg-[#e8edfa] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight leading-7">
            Hey, {staff.name.split(' ')[0] || 'there'}
          </h1>
          {isManager && activated ? (
            <Link href="/dashboard/customise" className="shrink-0 pt-0.5 text-sm font-semibold text-[#1e3a8a]">
              Customise home
            </Link>
          ) : null}
        </div>
        {summary ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a4e57]">{summary}</p> : null}
      </section>

      {!home || !bookings ? (
        <div className="mt-6 rounded-[20px] border border-[#e4e6eb] bg-white p-8 text-center">
          <p className="text-[#4a4e57]">We couldn&apos;t load your bookings.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-[#1e3a8a]">Try again</Link>
        </div>
      ) : (
        <>
        <div className="mt-3 grid min-w-0 items-start gap-3 lg:grid-cols-12">
          <div className="min-w-0 space-y-3 lg:col-span-8">
            {ready && approved ? (
              <BookingLinkCard url={bookings.link} total={bookings.total} />
            ) : ready ? (
              <section className="flex items-start gap-4 rounded-[24px] border border-[#e4e6eb] bg-white p-5 sm:p-6">
                <IconTile
                  name={profile?.approvalStatus === 'rejected' ? 'edit-3' : 'shield'}
                  className="h-11 w-11"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-6">
                    {profile?.approvalStatus === 'rejected' ? 'Update your business page' : 'Your booking page is ready'}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-[#4a4e57]">
                    {profile?.approvalStatus === 'rejected'
                      ? 'Fix what’s noted in the banner, then we’ll look again.'
                      : 'Your public booking link stays private until approval. Keep polishing your business page while you wait.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    <Link href="/dashboard/storefront?tab=page" className="text-sm font-semibold text-[#1e3a8a]">
                      {profile?.approvalStatus === 'rejected' ? 'Edit business page' : 'Review business page'}
                    </Link>
                    {profile?.approvalStatus !== 'rejected' ? (
                      <Link href="/dashboard/bookings/new" className="text-sm font-semibold text-[#1e3a8a]">
                        Book a walk-in
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
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
                      <Link href={step.href} className="flex items-center gap-3 py-4">
                        {step.done ? (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f6ee] text-[#166534]">
                            <Icon name="check" className="h-5 w-5" />
                          </span>
                        ) : (
                          <IconTile name={step.icon} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold ${step.done ? 'text-[#7d818b] line-through' : ''}`}>
                            {step.label}
                          </span>
                          <span className={`text-[13px] leading-5 ${step.done ? 'text-[#7d818b]' : 'text-[#4a4e57]'}`}>
                            {step.hint}
                          </span>
                        </span>
                        <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
                      </Link>
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

          </div>

          <aside className="min-w-0 space-y-3 lg:col-span-4">
            {otherAttention.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold">Other updates</h2>
                <div className="mt-3 space-y-2">
                  {otherAttention.map((item) => (
                    <ModuleLink
                      key={item.id}
                      moduleId={item.id}
                      href={HREF[item.id] ?? '/dashboard'}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-4 text-sm"
                    >
                      <IconTile name={item.icon} />
                      <span className="min-w-0 flex-1 leading-5">{ATTENTION_TEXT[item.id]?.(item.data.count, item.data) ?? item.title}</span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-[#c9ced8]" />
                    </ModuleLink>
                  ))}
                </div>
              </section>
            )}

            {suggestions.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold leading-5">Suggested for you</h2>
                <div className="mt-3 space-y-2">
                  {suggestions.map((item) => {
                    if (item.status === 'coming_soon') {
                      return (
                        <div key={item.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-dashed border-[#c9ced8] bg-white p-4">
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
                        className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#e4e6eb] bg-white p-4"
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

          <div className="lg:col-span-12">
            <ActivityBento
              role={staff.role}
              ready={ready}
              approved={approved}
              bookings={bookings.upcoming.slice(0, 5)}
              chats={recentChats}
              clients={recentClients}
            />
          </div>
        </div>

        {quickActions.length > 0 && (
          <section className="mt-6 min-w-0">
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
