'use client'

import { useActionState } from 'react'
import { inviteAdminAction } from '@/app/actions/team'

export function InviteAdminForm() {
  const [state, formAction, pending] = useActionState(inviteAdminAction, null)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
        <input name="name" required placeholder="Ada Lovelace"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-52 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
        <input name="email" type="email" required placeholder="ada@scalio.app"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <button type="submit" disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
        {pending ? 'Sending…' : 'Send invite'}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
