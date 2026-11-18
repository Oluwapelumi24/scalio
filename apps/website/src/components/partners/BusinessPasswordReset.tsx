'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { forgotBusinessPassword, resetBusinessPassword, type VendorAuthState } from '@/app/actions/vendor'

const EMPTY: VendorAuthState & { sent?: boolean; email?: string } = {}

export function BusinessPasswordReset({ initialEmail = '' }: { initialEmail?: string }) {
  const [sent, sendAction, sending] = useActionState(forgotBusinessPassword, { ...EMPTY, email: initialEmail, sent: Boolean(initialEmail) })
  const [reset, resetAction, resetting] = useActionState(resetBusinessPassword, EMPTY)
  const email = sent.email || initialEmail

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      {sent.sent ? (
        <form action={resetAction}>
          <input type="hidden" name="email" value={email} />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            If {email} has a business on Veno, a 6-digit code is in that inbox. It expires in 15 minutes. Saving the new password opens the dashboard.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-900">6-digit code</span>
            <input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              minLength={6}
              maxLength={6}
              pattern="\d{6}"
              placeholder="000000"
              className="mt-1.5 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-semibold tracking-[0.4em] text-slate-900 outline-none focus:border-navy focus:bg-white"
            />
          </label>
          <PasswordField name="password" label="New password" placeholder="At least 8 characters" />
          <PasswordField name="confirm" label="Confirm password" placeholder="Repeat the password" />
          {reset.error ? <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{reset.error}</p> : null}
          <button
            type="submit"
            disabled={resetting}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
          >
            {resetting ? 'Opening your dashboard…' : 'Save and open dashboard'}
          </button>
        </form>
      ) : (
        <form action={sendAction}>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter the email you used to register. We’ll send a code, then you can choose a new password.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-900">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={initialEmail}
              placeholder="you@example.com"
              className="mt-1.5 h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-navy focus:bg-white"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[20px] bg-navy text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? 'Sending code…' : 'Send code'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-navy">Back to sign in</Link>
      </p>
    </div>
  )
}

function PasswordField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false)
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="relative mt-1.5 block">
        <input
          required
          minLength={8}
          autoComplete="new-password"
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
