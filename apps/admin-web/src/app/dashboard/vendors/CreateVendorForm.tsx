'use client'

import { useActionState } from 'react'
import { createVendorAction } from '@/app/actions/vendors'

export function CreateVendorForm() {
  const [state, formAction, pending] = useActionState(createVendorAction, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
        <input name="businessName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Glow Studio" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
        <input name="slug" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="glow-studio" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <input name="category" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Salon" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input name="address" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="123 Main St, Lagos" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input name="logoUrl" type="url" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="https://…" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Theme colour</label>
        <input name="themeColor" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="#7C3AED" />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <input type="checkbox" id="featured" name="featured" value="true" className="rounded" />
        <label htmlFor="featured" className="text-sm text-gray-700">Featured on home screen</label>
      </div>

      {state?.error && <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

      <div className="col-span-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {pending ? 'Creating…' : 'Create vendor'}
        </button>
      </div>
    </form>
  )
}
