'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInAction, signUpAction, type AuthState } from '@/app/actions/customer'

const EMPTY: AuthState = {}

export function AuthForm({ mode, next }: { mode: 'sign-in' | 'sign-up'; next: string }) {
  const action = mode === 'sign-in' ? signInAction : signUpAction
  const [state, formAction, pending] = useActionState(action, EMPTY)
  const signingIn = mode === 'sign-in'

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{signingIn ? 'Sign in' : 'Create your account'}</h1>
      <p className="mt-2 text-sm text-[#4a4e57]">
        {signingIn ? 'Welcome back. Sign in to book and see your appointments.' : 'Create an account to finish booking.'}
      </p>
      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        {signingIn ? null : (
          <>
            <Field label="Full name" name="name" autoComplete="name" placeholder="Adaeze Okonkwo" />
            <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 000 0000" hint="The business uses this if they need to reach you about the visit." />
          </>
        )}
        <Field label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={signingIn ? 'current-password' : 'new-password'}
          placeholder={signingIn ? 'Your password' : 'At least 8 characters'}
          hint={signingIn ? undefined : 'Use 8 or more characters.'}
        />
        {state.error ? <p className="text-sm text-[#dc2626]">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Please wait…' : signingIn ? 'Sign in' : 'Continue'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#4a4e57]">
        {signingIn ? (
          <>
            New to Veno?{' '}
            <Link href={`/app/sign-up?next=${encodeURIComponent(next)}`} className="font-semibold text-[#1e3a8a]">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href={`/app/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-[#1e3a8a]">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        required
        {...props}
        className="mt-1.5 h-[52px] w-full rounded-2xl border border-[#e4e6eb] bg-[#f5f6f8] px-4 text-sm outline-none focus:border-[#1e3a8a] focus:bg-white"
      />
      {hint ? <span className="mt-1 block text-xs text-[#7d818b]">{hint}</span> : null}
    </label>
  )
}
