import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Terms and conditions',
  description: 'The terms for booking a service on Veno, and for listing a business.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>Veno lets you find a local business in Lagos and hold a time, and lets a business take those bookings. Browsing is free. You pay the business for the service, either when you arrive or online when they offer that.</p>
      <p>A time is held when the booking is confirmed. You can cancel an upcoming visit from Bookings. The business sees the cancellation and the time opens again. A business may still have its own cancellation practice for late changes and no-shows. Read that on the business page before you book.</p>
      <p>Online payments, when a business takes them, are processed by Paystack and settle to that business. Veno is not the seller of the spa, salon, laundry or other service.</p>
      <p>A business listing is reviewed before customers can find it. Registering does not by itself put the business on Veno. The business is responsible for its prices, hours, services and for showing up.</p>
      <p>Don’t use Veno to book or list anything unlawful. We can refuse or remove an account that abuses the service.</p>
    </LegalPage>
  )
}
