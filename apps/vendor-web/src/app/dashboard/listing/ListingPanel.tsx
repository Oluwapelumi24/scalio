import { apiFetch } from '@/lib/api'
import type { VendorProfile } from '@/lib/categories'
import { requireToken } from '@/lib/session'
import { ListingForm } from './ListingForm'

export async function ListingPanel() {
  const token = await requireToken()
  const profile = await apiFetch<VendorProfile>('/vendor-admin/profile', token)

  return (
    <ListingForm
      businessName={profile.businessName}
      category={profile.category}
      address={profile.address ?? ''}
      description={profile.description ?? ''}
      logoUrl={profile.logoUrl}
    />
  )
}
