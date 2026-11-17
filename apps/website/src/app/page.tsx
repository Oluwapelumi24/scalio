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
import { DesignSwitch } from '@/components/site/DesignSwitch'
import { CATEGORIES, SITE_URL } from '@/lib/constants'
import { designMode } from '@/lib/design-preview'

export async function generateMetadata(): Promise<Metadata> {
  const prelaunch = (await designMode()) !== 'launch'
  const title = prelaunch ? 'Veno — Opening soon. Join the waitlist.' : 'Veno — Book local services in Lagos'
  const description = prelaunch
    ? 'Veno is opening soon in Lagos. Join the waitlist to book spas, salons, laundry, tailors and other local services, or to list your business.'
    : 'Book spas, salons, laundry, tailors and other local services in Lagos. See a free time and hold it.'
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
    twitter: { title, description },
  }
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
export default async function Home() {
  const mode = await designMode()
  const prelaunch = mode === 'prelaunch'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <Navbar site={prelaunch ? 'prelaunch' : 'live'} />
      <main>
        <SearchHero prelaunch={prelaunch} />
        <ServiceGrid prelaunch={prelaunch} />
        <StandoutFeatures prelaunch={prelaunch} />
        <FindBookShow prelaunch={prelaunch} />
        <PayYourWay prelaunch={prelaunch} />
        <FeatureOrbs prelaunch={prelaunch} />
        <Faq variant={prelaunch ? 'prelaunch' : 'live'} />
        <Waitlist purpose={prelaunch ? 'launch' : 'later'} />
      </main>
      <Footer site={prelaunch ? 'prelaunch' : 'live'} />
      <DesignSwitch mode={mode} />
    </>
  )
}
