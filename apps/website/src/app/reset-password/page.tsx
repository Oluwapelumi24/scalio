import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/Navbar'
import { BusinessPasswordReset } from '@/components/partners/BusinessPasswordReset'

export const metadata: Metadata = {
  title: 'Set a new password',
  description: 'Choose a new password for your Veno business.',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <Link href="/" aria-label="Veno home">
            <Logo />
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <BusinessPasswordReset initialEmail={email ?? ''} />
      </div>
    </main>
  )
}
