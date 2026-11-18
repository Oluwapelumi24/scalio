'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { forgotPasswordAction, resetPasswordAction } from '@/app/actions/auth'
import { BrandLink } from '@/components/BrandLink'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null)
  const [reset, resetAction, resetting] = useActionState(resetPasswordAction, null)
  const email = state && 'success' in state ? state.email : undefined

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1>
            <BrandLink className="mx-auto h-10 w-auto" />
          </h1>
          <p className="text-sm text-gray-500 mt-3">Vendor Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{email ? 'Set a new password' : 'Reset password'}</h2>
          {email ? null : (
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we&apos;ll send you a 6-digit code to reset your password.
            </p>
          )}

          {email ? (
            <form action={resetAction} className="space-y-4">
              <input type="hidden" name="email" value={email} />
              <p className="text-sm text-gray-500">
                If {email} has an account, the code is in that inbox. It expires in 15 minutes. Saving the new password opens the dashboard.
              </p>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
                <input id="code" name="code" required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} pattern="[0-9]{6}" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-semibold tracking-[0.3em] text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="000000" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="At least 8 characters" />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Repeat the password" />
              </div>
              {reset !== null && 'error' in reset ? <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{reset.error}</p> : null}
              <button type="submit" disabled={resetting} className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60">
                {resetting ? 'Opening your dashboard…' : 'Save and open dashboard'}
              </button>
            </form>
          ) : (
            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              {'error' in (state ?? {}) && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {(state as { error: string }).error}
                </p>
              )}

              <button
                type="submit" disabled={pending}
                className="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b1638] disabled:opacity-60 transition-colors"
              >
                {pending ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          <Link href="/login" className="hover:text-gray-600 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
