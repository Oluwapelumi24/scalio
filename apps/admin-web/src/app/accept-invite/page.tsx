'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { acceptInviteAction } from '@/app/actions/auth'
import { Suspense } from 'react'

function AcceptInviteForm() {
  const [state, formAction, pending] = useActionState(acceptInviteAction, null)
  const token = useSearchParams().get('token') ?? ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scalio Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Set your password to activate your account</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="At least 8 characters" />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input id="confirm" name="confirm" type="password" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Repeat your password" />
            </div>
            {state?.error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}
            <button type="submit" disabled={pending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {pending ? 'Activating…' : 'Activate account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return <Suspense><AcceptInviteForm /></Suspense>
}
