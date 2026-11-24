'use client'

import { useActionState, useState } from 'react'
import { createStaff } from '@/app/actions/staff'
import { SelectMenu } from '@/components/SelectMenu'
import { STAFF_ROLES } from '@/lib/roles'

export function CreateStaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, null)
  const [role, setRole] = useState('')
  const hint = STAFF_ROLES.find((option) => option.value === role)?.hint

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
        <SelectMenu
          name="role"
          required
          value={role}
          onChange={setRole}
          placeholder="Select role…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          options={STAFF_ROLES.map((option) => ({ value: option.value, label: option.label }))}
        />
        {hint ? <p className="mt-1.5 text-xs leading-5 text-[#7d818b]">{hint}</p> : null}
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
          className="inline-flex h-10 items-center rounded-full bg-[#1e3a8a] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Adding…' : 'Add staff member'}
        </button>
        {state && 'error' in state ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state && 'warning' in state ? <p className="text-sm text-amber-700">{state.warning}</p> : null}
      </div>
    </form>
  )
}
