import { apiFetch } from '@/lib/api'
import type { VendorProfile } from '@/lib/categories'
import { requireToken } from '@/lib/session'
import { ListingForm } from './ListingForm'

export async function ListingPanel() {
  const token = await requireToken()
  const profile = await apiFetch<VendorProfile>('/vendor-admin/profile', token)

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-bold tracking-tight text-gray-900">Your business page</h2>
      <p className="mt-2 text-sm leading-6 text-[#4a4e57]">
        This is what customers see when they search. Pick the category that matches how people look for you, and the area you work in.
      </p>
      <div className="mt-6">
        <ListingForm
          category={profile.category}
          address={profile.address ?? ''}
          description={profile.description ?? ''}
          logoUrl={profile.logoUrl}
        />
      </div>
    </div>
  )
}
