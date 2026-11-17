'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerVendorAction, vendorSignInAction, type VendorAuthState } from '@/app/actions/vendor'

const EMPTY: VendorAuthState = {}

export function VendorAuthForm({ mode }: { mode: 'register' | 'sign-in' }) {
  const register = mode === 'register'
  const action = register ? registerVendorAction : vendorSignInAction
  const [state, formAction, pending] = useActionState(action, EMPTY)

  if (state.done === 'registered') {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">You&apos;re registered</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We have your business. Our team reviews every listing before it goes live. You can sign in here once the vendor dashboard is published.
        </p>
        <Link href="/partners" className="mt-6 inline-flex h-12 items-center justify-center rounded-[20px] bg-navy px-5 text-sm font-semibold text-white">
          Back to partners
        </Link>
      </div>
    )
  }

  if (state.done === 'signed-in') {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">You&apos;re signed in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The vendor dashboard is not on this website yet, so there is nowhere further to open from here.
        </p>
        <Link href="/partners" className="mt-6 inline-flex h-12 items-center justify-center rounded-[20px] bg-navy px-5 text-sm font-semibold text-white">
          Back to partners
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {register ? 'Register your business' : 'Sign in'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {register
          ? 'Create your vendor account. You can set up services and hours once we approve the listing.'
          : 'Sign in to the vendor dashboard for your business.'}
      </p>
      <form action={formAction} className="mt-8 space-y-4">
        {register ? (
          <>
            <Field label="Business name" name="businessName" autoComplete="organization" placeholder="Glow Beauty Studio" />
            <Field label="Your name" name="ownerName" autoComplete="name" placeholder="Amaka Okafor" />
          </>
        ) : null}
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        {register ? (
          <Field label="CAC registration number" name="registrationNumber" required={false} placeholder="RC1234567" hint="Optional" />
        ) : null}
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={register ? 'new-password' : 'current-password'}
          placeholder={register ? 'At least 8 characters' : 'Your password'}
        />
        {register ? (
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" placeholder="Repeat your password" />
        ) : null}
        {state.error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Please wait…' : register ? 'Register your business' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {register ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-navy">Sign in</Link>
          </>
        ) : (
          <>
            New to Veno?{' '}
            <Link href="/register" className="font-semibold text-navy">Register your business</Link>
          </>
        )}
      </p>
    </div>
  )
}

function Field({
  label,
  hint,
  required = true,
  ...props
}: { label: string; hint?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">
        {label}
        {hint ? <span className="ml-1 font-normal text-slate-400">{hint}</span> : null}
      </span>
      <input
        required={required}
        {...props}
        className="mt-1.5 h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-navy focus:bg-white"
      />
    </label>
  )
}
