'use client'

import { useActionState } from 'react'
import { createStaffAction } from '@/app/actions/vendor-staff'

export function AddStaffForm({ vendorId }: { vendorId: string }) {
  const action = createStaffAction.bind(null, vendorId)
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
        <select name="role" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="practitioner">Practitioner</option>
          <option value="front_desk">Front Desk</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(sends invite)</span></label>
        <input name="email" type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input name="phone" type="tel" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      {state?.error && <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

      <div className="col-span-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {pending ? 'Adding…' : 'Add staff member'}
        </button>
      </div>
    </form>
  )
}
