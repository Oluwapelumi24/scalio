import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { SearchHero } from '@/components/home/SearchHero'
import { ServiceGrid } from '@/components/home/ServiceGrid'
import { StandoutFeatures } from '@/components/home/StandoutFeatures'
import { FindBookShow } from '@/components/home/FindBookShow'
import { PayYourWay } from '@/components/home/PayYourWay'
import { FeatureOrbs } from '@/components/home/Sections'
import { Faq } from '@/components/Faq'
import { Waitlist } from '@/components/Waitlist'
import { Footer } from '@/components/Footer'
import { CATEGORIES, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Veno — Opening soon. Join the waitlist.',
  description:
    'Veno is opening soon in Lagos. Join the waitlist to book spas, salons, laundry, tailors and other local services, or to list your business.',
}

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

/** Waitlist home — the public site until booking opens. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <Navbar site="prelaunch" />
      <main>
        <SearchHero prelaunch />
        <ServiceGrid prelaunch />
        <StandoutFeatures prelaunch />
        <FindBookShow prelaunch />
        <PayYourWay prelaunch />
        <FeatureOrbs prelaunch />
        <Faq variant="prelaunch" />
        <Waitlist purpose="launch" />
      </main>
      <Footer site="prelaunch" />
    </>
  )
}
