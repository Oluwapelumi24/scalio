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

const title = 'Veno — Book local services in Lagos'
const description =
  'Book spas, salons, laundry, tailors and other local services in Lagos. See a free time and hold it.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description },
  twitter: { title, description },
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

/** Live marketing home. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <Navbar />
      <main>
        <SearchHero />
        <ServiceGrid />
        <StandoutFeatures />
        <FindBookShow />
        <PayYourWay />
        <FeatureOrbs />
        <Faq />
        <Waitlist purpose="later" />
      </main>
      <Footer />
    </>
  )
}
