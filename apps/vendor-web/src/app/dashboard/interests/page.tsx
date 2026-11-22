import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { listingReady, type VendorProfile } from '@/lib/categories'
import { MANAGER_ROLES, type HomeResponse, type InterestGroup, type Preferences } from '@/lib/personalisation'
import { InterestPicker } from './InterestPicker'

export default async function InterestsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const token = await requireToken()
  const staff = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (!MANAGER_ROLES.includes(staff.role)) redirect('/dashboard')

  const [profile, home] = await Promise.all([
    apiFetch<VendorProfile>('/vendor-admin/profile', token).catch(() => null),
    apiFetch<HomeResponse>('/vendor-admin/home', token).catch(() => null),
  ])
  const setupReady =
    !!home?.bookings.setup.services &&
    !!home?.bookings.setup.hours &&
    listingReady(profile)
  if (profile?.approvalStatus !== 'approved' || !setupReady) redirect('/dashboard')

  const { welcome } = await searchParams
  const [groups, prefs] = await Promise.all([
    apiFetch<InterestGroup[]>('/vendor-admin/personalisation/interests', token),
    apiFetch<Preferences>('/vendor-admin/preferences', token),
  ])

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="max-w-xl text-[1.75rem] font-bold leading-[1.15] tracking-tight text-[#0a0a0a] sm:text-3xl">
          What do you want help with?
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#4a4e57]">
          Choose what matters most to your business. We&apos;ll set up Veno to help you get things done.
        </p>
      </div>
      <InterestPicker groups={groups} initial={prefs.interests} welcome={welcome === '1'} />
    </div>
  )
}
