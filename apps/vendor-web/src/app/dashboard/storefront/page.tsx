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
  const copy = {
    page: {
      title: 'Business page',
      body: 'What customers see when they find you — name, area, and photos.',
    },
    services: {
      title: 'Services',
      body: 'What people can book, how long it takes, and what it costs.',
    },
    team: {
      title: 'Team',
      body: 'Who works here, their roles, and who can take bookings.',
    },
    hours: {
      title: 'Hours',
      body: 'When you’re open, and days you’ve blocked off.',
    },
  }[tab]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{copy.title}</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#4a4e57]">{copy.body}</p>
      </div>

      <StorefrontTabs active={tab} />

      <div
        role="tabpanel"
        id={`storefront-panel-${tab}`}
        aria-labelledby={`storefront-tab-${tab}`}
        className="max-w-5xl"
      >
        {tab === 'page' ? <ListingPanel /> : null}
        {tab === 'services' ? <ServicesPanel /> : null}
        {tab === 'team' ? <StaffPanel /> : null}
        {tab === 'hours' ? <HoursPanel /> : null}
      </div>
    </div>
  )
}
