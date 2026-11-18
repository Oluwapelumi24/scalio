'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { vendorSignInAction, type VendorAuthState } from '@/app/actions/vendor'

const EMPTY: VendorAuthState = {}

export function VendorAuthForm() {
  const [state, formAction, pending] = useActionState(vendorSignInAction, EMPTY)

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Business dashboard</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use the email you verified when you registered the business.
      </p>
      <form action={formAction} className="mt-8 space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email ?? ''}
          key={state.email ?? 'email'}
        />
        <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Your password" />
        <p className="text-right text-sm">
          <Link href="/forgot-password" className="font-semibold text-navy">Forgot password?</Link>
        </p>
        {state.error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Open dashboard'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to Veno?{' '}
        <Link href="/register" className="font-semibold text-navy">Register your business</Link>
      </p>
    </div>
  )
}

function PasswordField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false)
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="relative mt-1.5 block">
        <input
          required
          {...props}
          type={shown ? 'text' : 'password'}
          className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base text-slate-900 outline-none focus:border-navy focus:bg-white"
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  )
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <input
        required
        {...props}
        className="mt-1.5 h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-navy focus:bg-white"
      />
    </label>
  )
}
