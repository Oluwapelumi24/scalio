import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What Veno stores when you book a service or list a business in Lagos.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>Veno is a booking service for local businesses in Lagos. This page says what we keep so a booking can happen.</p>
      <p>If you create a customer account, we store your name, email, password (as a hash, not the password itself) and, when you give it, your mobile number. The business you book can see your name, email and mobile number so they can reach you about that visit.</p>
      <p>A booking stores the business, the services, the time and how you chose to pay. If you pay online, Paystack processes the card or transfer. Veno does not store your card number.</p>
      <p>If you register a business, we store the business name, category, area, owner name, email, optional phone and optional CAC number. Listings stay hidden from customers until we review them.</p>
      <p>The area you pick on your phone or computer is saved in that browser so the next visit can start there. Signing in uses a cookie that the site can read only on the server.</p>
      <p>We do not sell this information. We use it to run bookings, show a business its own customers, and review new listings.</p>
    </LegalPage>
  )
}
