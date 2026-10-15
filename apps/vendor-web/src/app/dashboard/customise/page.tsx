import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES, type HomeResponse, type Preferences } from '@/lib/personalisation'
import { CustomiseList, type CustomiseRow } from './CustomiseList'

export default async function CustomisePage() {
  const token = await requireToken()
  const staff = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (!MANAGER_ROLES.includes(staff.role)) redirect('/dashboard')

  const [home, prefs] = await Promise.all([
    apiFetch<HomeResponse>('/vendor-admin/home', token),
    apiFetch<Preferences>('/vendor-admin/preferences', token),
  ])
  const rows: CustomiseRow[] = [
    ...home.layers.overview,
    ...home.layers.quick_action,
    ...home.layers.recommendation,
    ...home.hidden,
  ].map(({ id, layer, title }) => ({ id, layer, title }))

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customise home</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pin what you use most to the top. Hidden items stay available in the menu. Alerts that need your attention
          always show. Changes apply on mobile too.
        </p>
        <Link href="/dashboard/interests" className="inline-block mt-3 text-sm font-medium text-indigo-600">
          Change what you want help with →
        </Link>
      </div>
      <CustomiseList rows={rows} pinned={prefs.pinnedModules} hidden={prefs.hiddenModules} />
    </div>
  )
}
