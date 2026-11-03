'use client'

import { useActionState } from 'react'
import { updateVendorAction } from '@/app/actions/vendors'

interface Vendor {
  id: string; slug: string; businessName: string; category: string
  logoUrl: string | null; themeColor: string | null; address: string | null; featured: boolean
  slotIntervalMinutes?: number
}

const SLOT_INTERVALS = [10, 15, 20, 30, 45, 60]

export function EditVendorForm({ vendor }: { vendor: Vendor }) {
  const action = updateVendorAction.bind(null, vendor.id)
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
        <input name="businessName" defaultValue={vendor.businessName}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
        <input name="slug" defaultValue={vendor.slug}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input name="category" defaultValue={vendor.category}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input name="address" defaultValue={vendor.address ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input name="logoUrl" defaultValue={vendor.logoUrl ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Theme colour</label>
        <input name="themeColor" defaultValue={vendor.themeColor ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="slotIntervalMinutes" className="block text-sm font-medium text-gray-700 mb-1">Gap between booking times</label>
        <select id="slotIntervalMinutes" name="slotIntervalMinutes" defaultValue={String(vendor.slotIntervalMinutes ?? 30)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {SLOT_INTERVALS.map((m) => (
            <option key={m} value={m}>Every {m} minutes{m === 30 ? ' (default)' : ''}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">How far apart the start times are that clients and staff can pick, e.g. 9:00, 9:30, 10:00.</p>
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <input type="checkbox" id="featured" name="featured" value="true" defaultChecked={vendor.featured} className="rounded" />
        <label htmlFor="featured" className="text-sm text-gray-700">Featured on home screen</label>
      </div>

      {state?.error && <p className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>}

      <div className="col-span-2">
        <button type="submit" disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
