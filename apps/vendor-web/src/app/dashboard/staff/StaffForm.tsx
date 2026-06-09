'use client'

import { useActionState } from 'react'
import { createStaff } from '@/app/actions/staff'

export function CreateStaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
        <select
          name="role"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select role…</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="practitioner">Practitioner</option>
          <option value="front_desk">Front Desk</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(sends invite)</span>
        </label>
        <input
          name="email"
          type="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="staff@example.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
        <input
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="+234…"
        />
      </div>

      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Adding…' : 'Add staff member'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  )
}
