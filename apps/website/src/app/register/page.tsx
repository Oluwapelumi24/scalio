import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Navbar'
import { VendorAuthForm } from '@/components/partners/VendorAuthForm'
import { VENDOR_PORTAL_LINKED, VENDOR_REGISTER_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Register your business — Veno',
  description: 'Create a Veno vendor account for your business.',
  alternates: { canonical: '/register' },
}

export default function RegisterPage() {
  if (VENDOR_PORTAL_LINKED) redirect(VENDOR_REGISTER_URL)
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
        <VendorAuthForm mode="register" />
      </div>
    </main>
  )
}
