import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CategoryMarquee } from '@/components/home/CategoryMarquee'
import { ClosingCta } from '@/components/home/Sections'
import { Reveal } from '@/components/Reveal'
import { Testimonials } from '@/components/Testimonials'
import { PartnerHeroStage } from '@/components/partners/PartnerHeroStage'
import { SkyHero } from '@/components/site/SkyHero'
import { SetupSteps } from '@/components/partners/SetupSteps'
import { FeatureTour } from '@/components/partners/FeatureTour'
import { PartnerFaq } from '@/components/partners/PartnerFaq'
import { VENDOR_REGISTER_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Booking App for Service Businesses in Lagos | Veno for Partners',
  description:
    'Veno gives Lagos spas, salons, barbers, tailors, laundries, cleaners and Pilates studios a booking link, team calendar, one inbox for DMs, deposits and payouts.',
  alternates: { canonical: '/partners' },
}

export default function PartnersPage() {
  return (
    <>
      <Navbar />
      <main>
        <SkyHero
          audience="business"
          title={<>Your bookings, clients and payments. One app.</>}
          subtitle="Manage your team, schedule, clients and money from one place."
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

        {/* Everything in the app, in one carousel */}
        <section id="features" className="scroll-mt-20 bg-slate-50 pb-16 pt-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="mb-8 max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-wide text-navy">Inside the app</span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Everything your front desk does, in your pocket</h2>
            </Reveal>
            <FeatureTour />
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
