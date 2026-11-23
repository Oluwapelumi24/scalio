import Link from 'next/link'
import { designMode } from '@/lib/design-preview'

export default async function NotFound() {
  const prelaunch = (await designMode()) === 'prelaunch'
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-semibold text-[#1e3a8a]">Veno</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">We can’t find that page</h1>
      <p className="mt-3 text-sm leading-6 text-[#4a4e57]">The link may be old, or the business may not be on Veno yet.</p>
      <Link
        href={prelaunch ? '/#waitlist' : '/app'}
        className="mt-6 inline-flex h-12 w-fit items-center rounded-full bg-[#1e3a8a] px-5 text-sm font-semibold text-white"
      >
        {prelaunch ? 'Join the waitlist' : 'Find a business'}
      </Link>
    </main>
  )
}
