'use client'

import { useActionState } from 'react'
import { forgotPasswordAction, resetPasswordAction } from '@/app/actions/auth'

export function PasswordForm({ email }: { email: string }) {
  const [sent, sendAction, sending] = useActionState(forgotPasswordAction, null)
  const [reset, resetAction, resetting] = useActionState(resetPasswordAction, null)
  const codeSent = sent && 'success' in sent

  return (
    <div className="rounded-[20px] border border-[#e4e6eb] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#0a0a0a]">Password</h2>
      <p className="mt-1 text-[13px] leading-5 text-[#4a4e57]">
        We’ll email a 6-digit code to {email}. It expires in 15 minutes.
      </p>
      {codeSent ? (
        <form action={resetAction} className="mt-4 space-y-3">
          <input type="hidden" name="email" value={email} />
          <div>
            <label htmlFor="code" className="mb-1 block text-xs font-semibold text-[#4a4e57]">
              6-digit code
            </label>
            <input
              id="code"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              className="w-full rounded-xl border border-[#e4e6eb] px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="000000"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-[#4a4e57]">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#e4e6eb] px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-xs font-semibold text-[#4a4e57]">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#e4e6eb] px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
          {reset && 'error' in reset ? <p className="text-sm text-red-600">{reset.error}</p> : null}
          <button
            type="submit"
            disabled={resetting}
            className="rounded-full bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {resetting ? 'Saving…' : 'Save password'}
          </button>
        </form>
      ) : (
        <form action={sendAction} className="mt-4">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Email me a code'}
          </button>
        </form>
      )}
    </div>
  )
}
