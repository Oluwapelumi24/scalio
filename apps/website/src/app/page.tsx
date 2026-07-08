import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { TrustBar } from '@/components/TrustBar'
import { CustomerSection } from '@/components/CustomerSection'
import { VendorSection } from '@/components/VendorSection'
import { Waitlist } from '@/components/Waitlist'
import { Faq } from '@/components/Faq'
import { FinalCta } from '@/components/FinalCta'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <CustomerSection />
        <VendorSection />
        <Waitlist />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
