'use client'

import { useActionState, useState } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Reveal } from './Reveal'
import { joinWaitlistAction } from '@/app/actions/waitlist'

export function Waitlist() {
  const [state, formAction, pending] = useActionState(joinWaitlistAction, null)
  const [audience, setAudience] = useState<'customer' | 'vendor'>('customer')
  const done = state !== null && 'success' in state

  return (
    <section id="waitlist" className="scroll-mt-20 bg-slate-50/60 py-24">
      <Reveal className="mx-auto max-w-xl px-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-wash px-3 py-1 text-xs font-medium text-navy">
          Early access
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Not ready yet? Join the waitlist.
        </h2>
        <p className="mt-3 text-slate-600">
          The Veno app isn&apos;t on the app stores just yet, and we&apos;re onboarding
          businesses in new categories every week. Leave your email and we&apos;ll let you know
          the moment it&apos;s your turn.
        </p>

        {done ? (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="font-semibold text-emerald-800">You&apos;re on the list.</p>
            <p className="text-sm text-emerald-700">We&apos;ll email you as soon as it&apos;s ready.</p>
          </div>
        ) : (
          <form action={formAction} className="mt-8">
            <input type="hidden" name="audience" value={audience} />

            <div className="mx-auto flex w-fit rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAudience('customer')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  audience === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                I&apos;m a user
              </button>
              <button
                type="button"
                onClick={() => setAudience('vendor')}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  audience === 'vendor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                I&apos;m a partner
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-60"
              >
                {pending ? 'Joining…' : 'Join the waitlist'}
              </button>
            </div>

            {state !== null && 'error' in state && (
              <p className="mt-3 text-sm text-red-600">{state.error}</p>
            )}
          </form>
        )}
      </Reveal>
    </section>
  )
}
