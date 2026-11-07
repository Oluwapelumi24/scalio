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

export const metadata: Metadata = {
  title: 'Veno — Opening soon. Join the waitlist.',
  description:
    'Veno is opening soon in Lagos. Join the waitlist to book spas, salons, laundry, tailors and other local services, or to list your business.',
}

/** Pre-launch copy of the home page. The live site stays at /. */
export default function PrelaunchHome() {
  return (
    <>
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
