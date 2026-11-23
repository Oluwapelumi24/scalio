import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Navbar'
import { VendorAuthForm } from '@/components/partners/VendorAuthForm'
import { dashboardLoginUrl, dashboardPortalLinked } from '@/lib/vendor-portal'

export const metadata: Metadata = {
  title: 'Vendor sign in — Veno',
  description: 'Sign in to your Veno vendor account.',
  alternates: { canonical: '/login' },
}

export default function VendorLoginPage() {
  // Seller product owns auth when the portal is linked — marketing site does not.
  if (dashboardPortalLinked()) redirect(dashboardLoginUrl())
  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <Link href="/" aria-label="Veno home">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-md px-6 py-12">
        <VendorAuthForm />
      </div>
    </main>
  )
}
