import { Navbar } from '@/components/Navbar'
import { SkyHero } from '@/components/site/SkyHero'
import { HomeHeroStage } from '@/components/home/HeroStage'
import { CategoryMarquee } from '@/components/home/CategoryMarquee'
import { ServicesDirectory } from '@/components/home/ServicesDirectory'
import { BookingShowcase } from '@/components/home/BookingShowcase'
import { ForBusiness, HowItWorks } from '@/components/home/Sections'
import { Testimonials } from '@/components/Testimonials'
import { Waitlist } from '@/components/Waitlist'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'
import { CATEGORIES, SITE_URL } from '@/lib/constants'

// Tells search engines what Veno is and which services it covers. Every service
// here also appears as visible text in ServicesDirectory.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Veno', url: SITE_URL, areaServed: { '@type': 'City', name: 'Lagos' } },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Veno', url: SITE_URL, publisher: { '@id': `${SITE_URL}/#organization` } },
    ...CATEGORIES.map((c) => ({
      '@type': 'Service',
      name: c.heading,
      serviceType: c.name,
      description: c.description,
      areaServed: { '@type': 'City', name: 'Lagos' },
      provider: { '@id': `${SITE_URL}/#organization` },
    })),
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <Navbar />
      <main>
        <SkyHero
          audience="individuals"
          title={<>Book the services your week runs on</>}
          subtitle="See real free times, book in a minute, and pay the way you like."
          stage={<HomeHeroStage />}
        />
        <CategoryMarquee />
        <BookingShowcase />
        <HowItWorks />
        <ServicesDirectory />
        <ForBusiness />
        <Testimonials start="user" />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </>
  )
}
