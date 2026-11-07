'use client'

import { Suspense, useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Reveal } from './Reveal'
import { ArchScene } from './home/Sections'
import { joinWaitlistAction } from '@/app/actions/waitlist'

function WaitlistIntro({ purpose }: { purpose: 'later' | 'launch' }) {
  const service = useSearchParams().get('service')
  if (service) {
    return (
      <p className="mt-3 text-slate-600">
        You want <span className="font-semibold text-slate-900">{service}</span>. Leave your email and we&apos;ll write
        when you can book it.
      </p>
    )
  }
  if (purpose === 'launch') {
    return (
      <p className="mt-3 text-slate-600">
        Veno isn&apos;t open yet. Leave your email and we&apos;ll write when you can book, or when your business can
        take bookings.
      </p>
    )
  }
  return (
    <p className="mt-3 text-slate-600">
      The Veno app isn&apos;t on the app stores just yet, and we&apos;re onboarding businesses in new categories every
      week. Leave your email and we&apos;ll let you know the moment it&apos;s your turn.
    </p>
  )
}

function AudienceToggle({
  audience,
  setAudience,
  variant,
}: {
  audience: 'customer' | 'vendor'
  setAudience: (value: 'customer' | 'vendor') => void
  variant: 'live' | 'launch'
}) {
  if (variant === 'live') {
    return (
      <div className="flex w-fit rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          aria-pressed={audience === 'customer'}
          onClick={() => setAudience('customer')}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            audience === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          I&apos;m a user
        </button>
        <button
          type="button"
          aria-pressed={audience === 'vendor'}
          onClick={() => setAudience('vendor')}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            audience === 'vendor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          I&apos;m a partner
        </button>
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Who is joining"
      className="grid grid-cols-2 rounded-full bg-white p-1 ring-1 ring-slate-200"
      onKeyDown={(event) => {
        const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
        const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        if (!forward && !back) return
        event.preventDefault()
        const order = ['customer', 'vendor'] as const
        const index = order.indexOf(audience)
        const next = order[(index + (forward ? 1 : -1) + order.length) % order.length]
        setAudience(next)
        event.currentTarget.querySelector<HTMLButtonElement>(`[data-audience="${next}"]`)?.focus()
      }}
    >
      {(
        [
          ['customer', "I'm a user"],
          ['vendor', "I'm a partner"],
        ] as const
      ).map(([value, label]) => {
        const on = audience === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            data-audience={value}
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => setAudience(value)}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
              on ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** Live arch form, or the centered pre-launch waitlist when `purpose="launch"`. */
export function Waitlist({
  purpose = 'later',
  defaultAudience = 'customer',
}: {
  purpose?: 'later' | 'launch'
  defaultAudience?: 'customer' | 'vendor'
}) {
  const [state, formAction, pending] = useActionState(joinWaitlistAction, null)
  const [audience, setAudience] = useState<'customer' | 'vendor'>(defaultAudience)
  const done = state !== null && 'success' in state
  const launch = purpose === 'launch'

  const form = done ? null : (
    <form action={formAction} className={launch ? 'mt-8' : 'mt-7 max-w-xl'}>
      <input type="hidden" name="audience" value={audience} />
      <AudienceToggle audience={audience} setAudience={setAudience} variant={launch ? 'launch' : 'live'} />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="email"
            name="email"
            required
            aria-label="Email address"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-60"
        >
          {pending ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {state !== null && 'error' in state ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
    </form>
  )

  if (launch) {
    return (
      <section id="waitlist" className="scroll-mt-20 bg-slate-50/60 py-24">
        <Reveal className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Join the waitlist.</h2>
          <Suspense
            fallback={
              <p className="mt-3 text-slate-600">
                Veno isn&apos;t open yet. Leave your email and we&apos;ll write when you can book, or when your business can
                take bookings.
              </p>
            }
          >
            <WaitlistIntro purpose={purpose} />
          </Suspense>
          {done ? (
            <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
              <p className="font-semibold text-emerald-800">You&apos;re on the list.</p>
              <p className="text-sm text-emerald-700">We&apos;ll email you as soon as it&apos;s ready.</p>
            </div>
          ) : (
            form
          )}
        </Reveal>
      </section>
    )
  }

  return (
    <section id="waitlist" className="scroll-mt-20 bg-white px-6 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Reveal className="hidden lg:block">
          <ArchScene className="max-w-[400px]" />
        </Reveal>
        <Reveal delay={0.1}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-wash px-3 py-1 text-xs font-medium text-navy">
            Early access
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
            Your city&apos;s best, one tap away.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            The Veno app isn&apos;t on the app stores just yet. Leave your email and we&apos;ll let you know the moment it&apos;s
            your turn.
          </p>
          {done ? (
            <div className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-800">You&apos;re on the list.</p>
                <p className="text-sm text-emerald-700">We&apos;ll email you as soon as it&apos;s ready.</p>
              </div>
            </div>
          ) : (
            form
          )}
        </Reveal>
      </div>
    </section>
  )
}
