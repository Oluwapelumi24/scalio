import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <p className="text-sm font-semibold text-navy">
          <Link href="/">Veno</Link>
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <div className="mt-8 space-y-4 text-[15px] leading-7 text-slate-700">{children}</div>
      </main>
      <Footer />
    </>
  )
}
