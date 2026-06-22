'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { forgotPasswordAction } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null)
  const sent = state === null && pending === false

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Scalio</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Reset password</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we&apos;ll send you a 6-digit code to reset your password.
          </p>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                If this email has an account, a reset code has been sent. Check your inbox.
              </p>
              <Link
                href="/reset-password"
                className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Enter reset code
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@scalio.app"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
              )}

              <button
                type="submit" disabled={pending}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
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
