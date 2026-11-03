import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { SkyHero, SkyButton } from '@/components/site/SkyHero'
import { HomeHeroStage } from '@/components/home/HeroStage'
import { CategoryMarquee } from '@/components/home/CategoryMarquee'
import { BookingShowcase } from '@/components/home/BookingShowcase'
import { ClosingCta, FeatureOrbs, ForBusiness, HowItWorks, PayYourWay } from '@/components/home/Sections'
import { Testimonials } from '@/components/Testimonials'
import { Waitlist } from '@/components/Waitlist'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <SkyHero
          audience="individuals"
          title={<>Book the services your week runs on</>}
          subtitle="Spas, laundromats, tailors, cleaners, photographers, trainers, salons and more across Lagos. See real free times, book in a minute, and pay the way you like."
          actions={
            <>
              <SkyButton href="#waitlist">Get early access <ArrowRight className="h-4 w-4" /></SkyButton>
              <SkyButton href="#customers" variant="ghost">See how it works</SkyButton>
            </>
          }
          stage={<HomeHeroStage />}
        />
        <CategoryMarquee />
        <BookingShowcase />
        <HowItWorks />
        <PayYourWay />
        <FeatureOrbs />
        <ForBusiness />
        <Testimonials start="user" />
        <Waitlist />
        <Faq />
        <ClosingCta title="Your city's best, one tap away." cta="Join the waitlist" href="#waitlist" />
      </main>
      <Footer />
    </>
  )
}
