import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Navbar'
import { BusinessOnboarding } from '@/components/partners/BusinessOnboarding'
import { dashboardPortalLinked, dashboardRegisterUrl } from '@/lib/vendor-portal'

export const metadata: Metadata = {
  title: 'Register your business — Veno',
  description: 'Create a Veno vendor account for your business.',
  alternates: { canonical: '/register' },
}

export default function RegisterPage() {
  // Seller product owns registration when the portal is linked.
  if (dashboardPortalLinked()) redirect(dashboardRegisterUrl())
  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <Link href="/" aria-label="Veno home">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10">
        <BusinessOnboarding />
      </div>
    </main>
  )
}
