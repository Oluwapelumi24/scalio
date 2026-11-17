'use client'

import { useActionState } from 'react'
import { saveListingAction, type ListingState } from '@/app/actions/profile'
import { SelectMenu } from '@/components/SelectMenu'
import { BUSINESS_CATEGORIES } from '@/lib/categories'

export function ListingForm({
  category,
  address,
  description,
}: {
  category: string
  address: string
  description: string
}) {
  const [state, action, pending] = useActionState(saveListingAction, null as ListingState)
  const known = BUSINESS_CATEGORIES.includes(category as (typeof BUSINESS_CATEGORIES)[number])

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">What do you offer?</span>
        <SelectMenu
          name="category"
          required
          defaultValue={known ? category : ''}
          placeholder="Choose a category"
          className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 text-sm"
          options={BUSINESS_CATEGORIES.map((item) => ({ value: item, label: item }))}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Where are you?</span>
        <input
          name="address"
          required
          minLength={3}
          defaultValue={address}
          placeholder="Lekki Phase 1, Lagos"
          className="mt-1.5 h-12 w-full rounded-2xl border border-[#e4e6eb] px-4 text-sm"
        />
        <span className="mt-1 block text-xs text-[#7d818b]">Customers search by neighbourhood. Include the area and city.</span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">A short description</span>
        <textarea
          name="description"
          defaultValue={description}
          maxLength={600}
          rows={4}
          placeholder="What should a customer know before they book?"
          className="mt-1.5 w-full rounded-2xl border border-[#e4e6eb] px-4 py-3 text-sm"
        />
      </label>
      {state?.error ? <p className="text-sm text-[#dc2626]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save listing'}
      </button>
    </form>
  )
}
