import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES, type InterestGroup, type Preferences } from '@/lib/personalisation'
import { InterestPicker } from './InterestPicker'

export default async function InterestsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const token = await requireToken()
  const staff = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (!MANAGER_ROLES.includes(staff.role)) redirect('/dashboard')

  const { welcome } = await searchParams
  const [groups, prefs] = await Promise.all([
    apiFetch<InterestGroup[]>('/vendor-admin/personalisation/interests', token),
    apiFetch<Preferences>('/vendor-admin/preferences', token),
  ])

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">What do you want help with?</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose what matters most to your business. We&apos;ll set up Scalio to help you get things done.
        </p>
      </div>
      <InterestPicker groups={groups} initial={prefs.interests} welcome={welcome === '1'} />
    </div>
  )
}
