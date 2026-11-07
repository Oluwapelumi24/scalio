import type { Metadata } from 'next'
import { Bell, CalendarCheck, ClipboardList, CreditCard, Crown, Inbox, MessageCircle, Scissors, Star, UserCog, XCircle } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CategoryMarquee } from '@/components/home/CategoryMarquee'
import { Reveal } from '@/components/Reveal'
import { BookedHero } from '@/components/partners/BookedHero'
import { Waitlist } from '@/components/Waitlist'
import { BuiltFor } from '@/components/partners/BuiltFor'
import { SetupSteps } from '@/components/partners/SetupSteps'
import { FeatureTour } from '@/components/partners/FeatureTour'
import { PartnerFaq } from '@/components/partners/PartnerFaq'
import { PartnerFeatures } from '@/components/partners/PartnerFeatures'
export const metadata: Metadata = {
  title: 'Veno for partners — Opening soon. Join the waitlist.',
  description:
    'Veno is opening soon for spas, laundromats, tailors, salons and other appointment businesses in Lagos. Join the waitlist and we will write when you can register.',
}

const NOTIFICATIONS = [
  { Icon: CalendarCheck, title: 'New booking', body: 'Femisola booked Deep tissue massage for Sat 7 Nov, 10:00 am.', time: '2m', tone: 'bg-wash text-navy' },
  { Icon: CreditCard, title: 'Payment received', body: 'Femisola paid ₦9,000 for Sat 7 Nov, 10:00 am.', time: '2m', tone: 'bg-wash text-navy' },
  { Icon: MessageCircle, title: 'A chat needs you', body: 'Tolu on WhatsApp: The customer is asking about a refund.', time: '18m', tone: 'bg-wash text-navy' },
  { Icon: Star, title: 'New 5-star rating', body: 'Chidi rated their visit ★★★★★: "Left feeling brand new."', time: '1h', tone: 'bg-wash text-navy' },
  { Icon: XCircle, title: 'Booking cancelled', body: 'Kemi cancelled Facial on Fri 6 Nov, 4:30 pm.', time: '3h', tone: 'bg-red-50 text-red-600' },
]

const ROLES = [
  { Icon: Crown, role: 'Owner', sees: 'Everything: takings, payroll, ads, settings and every calendar.' },
  { Icon: ClipboardList, role: 'Manager', sees: 'Runs the day: services, hours, team and every booking.' },
  { Icon: Scissors, role: 'Practitioner', sees: 'Their own appointments, clients and ratings. Nothing else.' },
  { Icon: Inbox, role: 'Front desk', sees: 'Books walk-ins and answers the inbox, without seeing your money.' },
]

export default function PartnersPage() {
  return (
    <>
      <Navbar site="prelaunch" />
      <main>
        <BookedHero prelaunch />

        <CategoryMarquee />

        <BuiltFor />

        <PartnerFeatures />

        {/* The app's own set-up flow */}
        <section id="setup" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">When you join</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Booking-ready in an afternoon</h2>
              <p className="mt-4 text-lg text-slate-600">
                When registration opens, the app walks you through four steps. You can take your first booking after the second.
              </p>
            </Reveal>
            <div className="mt-12">
              <SetupSteps prelaunch />
            </div>
          </div>
        </section>

        {/* A tour of the app, tab by tab */}
        <section id="features" className="scroll-mt-20 bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mx-auto mb-10 max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">Inside the app</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Everything your front desk does, in your pocket</h2>
            </Reveal>
            <FeatureTour />
          </div>
        </section>

        <section className="grid lg:grid-cols-2">
          <div className="flex justify-end bg-white">
            <div className="w-full max-w-3xl px-6 py-20 sm:px-10 lg:py-24 lg:pl-10 lg:pr-14">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-wide text-navy">Stay on top of it</span>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Know the moment something changes</h2>
                <p className="mt-4 text-lg text-slate-600">
                  New bookings, cancellations, payments, ratings and chats that need a person all land under the bell on your
                  Home screen. Tap one to open the booking or the chat.
                </p>
              </Reveal>
              <Reveal delay={0.1} className="mt-10">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">Notifications</p>
                    <Bell className="h-5 w-5 text-slate-400" />
                  </div>
                  <ul className="mt-2 divide-y divide-slate-100">
                    {NOTIFICATIONS.map((n, i) => (
                      <li key={n.title} className="flex items-start gap-3 py-3.5">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.tone}`}>
                          <n.Icon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`flex-1 text-sm text-slate-900 ${i < 3 ? 'font-bold' : 'font-semibold'}`}>{n.title}</p>
                            <span className="text-xs text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-sm text-slate-600">{n.body}</p>
                        </div>
                        {i < 3 ? <span className="mt-2 h-2 w-2 rounded-full bg-navy" /> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="flex bg-navy text-white">
            <div className="flex w-full max-w-3xl flex-col px-6 py-20 sm:px-10 lg:py-24 lg:pl-14 lg:pr-10">
              <Reveal>
                <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                  <UserCog className="h-4 w-4" /> Your team
                </span>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Everyone gets their own login</h2>
                <p className="mt-4 text-lg text-white/75">
                  Invite your team and pick a role for each person. They only see what their job needs, and removing someone
                  takes effect straight away.
                </p>
              </Reveal>
              <div className="mt-10 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
                {ROLES.map((r, i) => (
                  <Reveal key={r.role} delay={i * 0.06} className="h-full">
                    <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <r.Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-base font-semibold">{r.role}</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{r.sees}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="partner-faq" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Questions from businesses</h2>
            </Reveal>
            <div className="mt-10">
              <PartnerFaq variant="prelaunch" />
            </div>
          </div>
        </section>

        <Waitlist purpose="launch" defaultAudience="vendor" />
      </main>
      <Footer site="prelaunch" />
    </>
  )
}
