import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import type { VendorProfile } from '@/lib/categories'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES } from '@/lib/personalisation'
import { ListingForm } from './ListingForm'

export default async function ListingPage() {
  const token = await requireToken()
  const staff = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (!MANAGER_ROLES.includes(staff.role)) redirect('/dashboard')
  const profile = await apiFetch<VendorProfile>('/vendor-admin/profile', token)

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Your listing</h1>
      <p className="mt-2 text-sm leading-6 text-[#4a4e57]">
        This is what customers see when they search. Pick the category that matches how people look for you, and the area you work in.
      </p>
      <div className="mt-6">
        <ListingForm
          category={profile.category}
          address={profile.address ?? ''}
          description={profile.description ?? ''}
        />
      </div>
    </div>
  )
}
