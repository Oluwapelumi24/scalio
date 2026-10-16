import { redirect } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api'
import { getToken } from '@/lib/session'
import { MANAGER_ROLES, type HomeItem, type HomeResponse, type Preferences } from '@/lib/personalisation'
import { ModuleLink } from './home/ModuleLink'
import { ShareLink } from './home/ShareLink'

interface StaffPrincipal { role: string; name: string }

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

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
  view_leads: '/dashboard/leads?filter=open',
}

const ATTENTION_TEXT: Record<string, (n: number, d: Record<string, number>) => string> = {
  awaiting_payment: (n) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} waiting for payment`,
  starting_soon: (n) => `${n} ${n === 1 ? 'booking starts' : 'bookings start'} within the hour`,
  unassigned_today: (n) => `${n} of today's ${n === 1 ? 'booking has' : 'bookings have'} no staff assigned`,
  bookings_on_leave: (n) => `${n} upcoming ${n === 1 ? 'booking is' : 'bookings are'} with staff on leave`,
  payroll_open: (_n, d) => `Payroll is open: ${d.toPay} ${d.toPay === 1 ? 'person' : 'people'} still to pay`,
  leads_due: (n) => `${n} ${n === 1 ? 'lead is' : 'leads are'} waiting for a follow-up`,
  posts_planned_today: (n) => `${n} ${n === 1 ? 'post is' : 'posts are'} planned for today`,
}

const RECOMMENDATION_TEXT: Record<string, (d: Record<string, number>) => string> = {
  choose_interests: () => 'Pick what you want help with and we will set up your home screen.',
  setup_services: () => 'Customers can only book once you have at least one service.',
  setup_hours: () => 'Let customers know when you are open.',
  setup_payments: () => 'Add your bank account so customers can pay deposits online.',
  setup_payroll: () => 'Set a pay day and salaries so payroll reminds you each month.',
  share_link_first: () => 'Share your booking link on WhatsApp or Instagram.',
  first_post: () => 'Add a photo, say what it is about, and AI writes the caption and hashtags.',
  follow_up_lapsed: (d) => `${d.count} ${d.count === 1 ? 'customer is' : 'customers are'} past their usual return time.`,
}

function tileValue(item: HomeItem): string {
  const d = item.data
  if (typeof d.amountKobo === 'number') return formatNaira(d.amountKobo)
  if (item.id === 'repeat_customers') return `${d.count} of ${d.totalCustomers}`
  if (typeof d.count === 'number') return d.count.toLocaleString()
  return '—'
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

  const tiles = home?.layers.overview.filter((i) => i.id !== 'upcoming_bookings') ?? []
  const upcoming = home?.layers.overview.find((i) => i.id === 'upcoming_bookings')

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {staff.name.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s your business today.</p>
        </div>
        {isManager && (
          <Link href="/dashboard/customise" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Customise home
          </Link>
        )}
      </div>

      {!home ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">We couldn&apos;t load your business overview.</p>
          <Link href="/dashboard" className="inline-block mt-3 text-sm font-medium text-indigo-600">Try again</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {home.layers.attention.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Needs your attention</h2>
              <div className="space-y-2">
                {home.layers.attention.map((item) => (
                  <ModuleLink
                    key={item.id}
                    moduleId={item.id}
                    href={HREF[item.id] ?? '/dashboard/bookings'}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-amber-100"
                  >
                    <span>{ATTENTION_TEXT[item.id]?.(item.data.count, item.data) ?? item.title}</span>
                    <span className="text-amber-700">View →</span>
                  </ModuleLink>
                ))}
              </div>
            </section>
          )}

          {tiles.length > 0 && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles.map((item) => (
                <ModuleLink
                  key={item.id}
                  moduleId={item.id}
                  href={HREF[item.id] ?? '/dashboard'}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 transition-colors"
                >
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{tileValue(item)}</p>
                </ModuleLink>
              ))}
            </section>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {upcoming && (
                <section className="bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">{upcoming.title}</h2>
                    <Link href="/dashboard/bookings" className="text-sm font-medium text-indigo-600">See all</Link>
                  </div>
                  {upcoming.data.bookings.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-gray-500 text-center">No upcoming bookings</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {upcoming.data.bookings.map((b: { id: string; customerName: string | null; scheduledAt: string; status: string }) => (
                        <li key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span className="font-medium text-gray-900">{b.customerName ?? 'Customer'}</span>
                          <span className="text-gray-500">
                            {formatWhen(b.scheduledAt)}
                            {b.status === 'pending_payment' ? ' · awaiting payment' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {home.layers.recommendation.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Suggested for you</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {home.layers.recommendation.map((item) =>
                      item.status === 'coming_soon' ? (
                        <div key={item.id} className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                            <span className="text-xs font-semibold rounded-full bg-gray-200 text-gray-600 px-2 py-0.5">Soon</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Coming soon — we&apos;ll let you know when it&apos;s ready.</p>
                        </div>
                      ) : item.id === 'share_link_first' ? (
                        <ShareLink key={item.id} moduleId={item.id} url={item.data.url} />
                      ) : (
                        <ModuleLink
                          key={item.id}
                          moduleId={item.id}
                          href={HREF[item.id] ?? '/dashboard'}
                          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300"
                        >
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{RECOMMENDATION_TEXT[item.id]?.(item.data) ?? ''}</p>
                        </ModuleLink>
                      ),
                    )}
                  </div>
                </section>
              )}
            </div>

            {home.layers.quick_action.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-gray-900 mb-3">Quick actions</h2>
                <div className="space-y-2">
                  {home.layers.quick_action.map((item) =>
                    item.id === 'share_booking_link' ? (
                      <ShareLink key={item.id} moduleId={item.id} url={item.data.url} />
                    ) : (
                      <ModuleLink
                        key={item.id}
                        moduleId={item.id}
                        href={HREF[item.id] ?? '/dashboard'}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:border-indigo-300"
                      >
                        {item.title}
                        <span className="text-gray-400">→</span>
                      </ModuleLink>
                    ),
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
