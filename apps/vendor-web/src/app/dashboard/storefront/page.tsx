import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES } from '@/lib/personalisation'
import { ListingPanel } from '../listing/ListingPanel'
import { ServicesPanel } from '../services/ServicesPanel'
import { StaffPanel } from '../staff/StaffPanel'
import { HoursPanel } from '../schedule/HoursPanel'
import { StorefrontTabs } from './StorefrontTabs'
import { parseStorefrontTab } from './tabs'

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const token = await requireToken()
  const staff = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (!MANAGER_ROLES.includes(staff.role)) redirect('/dashboard')

  const tab = parseStorefrontTab((await searchParams).tab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage storefront</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#4a4e57]">
          Your business page, services, team, and hours — one place customers book from.
        </p>
      </div>

      <StorefrontTabs active={tab} />

      <div
        role="tabpanel"
        id={`storefront-panel-${tab}`}
        aria-labelledby={`storefront-tab-${tab}`}
      >
        {tab === 'page' ? <ListingPanel /> : null}
        {tab === 'services' ? <ServicesPanel /> : null}
        {tab === 'team' ? <StaffPanel /> : null}
        {tab === 'hours' ? <HoursPanel /> : null}
      </div>
    </div>
  )
}
