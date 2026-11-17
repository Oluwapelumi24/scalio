import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Cookie information',
  description: 'The cookies Veno uses to keep you signed in.',
}

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie information">
      <p>Veno uses a small number of cookies so the site can remember you. We don’t use them to follow you around other websites.</p>
      <p>When you sign in as a customer, we set a cookie named customer_token. It holds your session and is only read by our server. Signing out deletes it.</p>
      <p>The business dashboard uses its own session cookie on that site, for the same reason.</p>
      <p>A design preview cookie, veno-design, remembers whether you are looking at the waitlist site or the live booking site. It does not identify you.</p>
      <p>The area you choose is stored in this browser’s local storage, not in a cookie. Clearing site data removes it.</p>
    </LegalPage>
  )
}
