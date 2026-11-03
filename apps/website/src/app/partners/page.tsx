import type { Metadata } from 'next'
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CreditCard,
  MessageCircle,
  Star,
  UserCog,
  XCircle,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CategoryMarquee } from '@/components/home/CategoryMarquee'
import { ClosingCta } from '@/components/home/Sections'
import { Reveal } from '@/components/Reveal'
import { Testimonials } from '@/components/Testimonials'
import { PartnerHeroStage } from '@/components/partners/PartnerHeroStage'
import { SkyButton, SkyHero } from '@/components/site/SkyHero'
import { SetupSteps } from '@/components/partners/SetupSteps'
import { FeatureTour } from '@/components/partners/FeatureTour'
import { PartnerFaq } from '@/components/partners/PartnerFaq'
import { VENDOR_LOGIN_URL, VENDOR_REGISTER_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Veno for partners — bookings, clients and payments in one app',
  description:
    'Veno gives spas, laundromats, tailors, salons, studios and other appointment-based businesses a booking link, a team calendar, one inbox for DMs, deposits and payouts, and tools to get booked again.',
}

const NOTIFICATIONS = [
  { Icon: CalendarCheck, title: 'New booking', body: 'Femisola booked Deep tissue massage for Sat 7 Nov, 10:00 am.', time: '2m', tone: 'bg-wash text-navy' },
  { Icon: CreditCard, title: 'Payment received', body: 'Femisola paid ₦9,000 for Sat 7 Nov, 10:00 am.', time: '2m', tone: 'bg-wash text-navy' },
  { Icon: MessageCircle, title: 'A chat needs you', body: 'Tolu on WhatsApp: The customer is asking about a refund.', time: '18m', tone: 'bg-wash text-navy' },
  { Icon: Star, title: 'New 5-star rating', body: 'Chidi rated their visit ★★★★★: "Left feeling brand new."', time: '1h', tone: 'bg-wash text-navy' },
  { Icon: XCircle, title: 'Booking cancelled', body: 'Kemi cancelled Facial on Fri 6 Nov, 4:30 pm.', time: '3h', tone: 'bg-red-50 text-red-600' },
]

const ROLES = [
  { role: 'Owner', sees: 'Everything: takings, payroll, ads, settings and every calendar.' },
  { role: 'Manager', sees: 'Runs the day: services, hours, team and every booking.' },
  { role: 'Practitioner', sees: 'Stylists, therapists, tailors, trainers: their own appointments, clients and ratings. Nothing else.' },
  { role: 'Front desk', sees: 'Books walk-ins and answers the inbox, without seeing your money.' },
]

export default function PartnersPage() {
  return (
    <>
      <Navbar />
      <main>
        <SkyHero
          audience="business"
          title={<>Your bookings, clients and payments. One app.</>}
          subtitle="Let clients book themselves from one link, see the whole day on one calendar, answer every DM in one inbox, and take deposits so no-shows stop costing you."
          actions={
            <>
              <SkyButton href={VENDOR_REGISTER_URL}>Register your business <ArrowRight className="h-4 w-4" /></SkyButton>
              <SkyButton href={VENDOR_LOGIN_URL} variant="ghost">I already have an account</SkyButton>
            </>
          }
          stage={<PartnerHeroStage />}
        />

        <CategoryMarquee />

        {/* The app's own set-up flow */}
        <section id="setup" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">Get started</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Booking-ready in an afternoon</h2>
              <p className="mt-4 text-lg text-slate-600">
                Once you are approved, the app walks you through four steps. You can take your first booking after the second.
              </p>
            </Reveal>
            <div className="mt-12">
              <SetupSteps />
            </div>
          </div>
        </section>

        <ClosingCta title="Ready to let clients book themselves?" cta="Register your business" href={VENDOR_REGISTER_URL} />

        {/* A tour of the app, tab by tab */}
        <section id="features" className="scroll-mt-20 bg-slate-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mb-10 max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">Inside the app</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Everything your front desk does, in your pocket</h2>
            </Reveal>
            <FeatureTour />
          </div>
        </section>

        {/* Notifications: the bell on Home */}
        <section className="py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">Stay on top of it</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Know the moment something changes</h2>
              <p className="mt-4 text-lg text-slate-600">
                New bookings, cancellations, payments, ratings and chats that need a person all land under the bell on your
                Home screen. Tap one to open the booking or the chat.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy/10">
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
        </section>

        {/* Team and roles */}
        <section className="bg-navy py-24 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="max-w-2xl">
              <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/70">
                <UserCog className="h-4 w-4" /> Your team
              </span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Everyone gets their own login</h2>
              <p className="mt-4 text-lg text-white/75">
                Invite your team and pick a role for each person. They only see what their job needs, and removing someone
                takes effect straight away.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r, i) => (
                <Reveal key={r.role} delay={i * 0.06}>
                  <div className="h-full rounded-3xl bg-white/[0.07] p-6 ring-1 ring-white/10">
                    <p className="text-base font-semibold">{r.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{r.sees}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Testimonials start="partner" tone="wash" />

        <section id="partner-faq" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Questions from businesses</h2>
            </Reveal>
            <div className="mt-10">
              <PartnerFaq />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
