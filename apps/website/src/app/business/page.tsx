import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { openDashboardAction, signOutBusinessAction } from '@/app/actions/vendor'
import { Logo } from '@/components/Navbar'
import { SetupBoard, type SetupHour, type SetupService } from '@/components/partners/SetupBoard'
import { ApiError, apiFetch } from '@/lib/api'
import { businessToken } from '@/lib/business-session'
import { dashboardPortalLinked } from '@/lib/vendor-portal'

export const metadata: Metadata = {
  title: 'Your business',
  description: 'Finish setting up your business on Veno.',
}

interface Profile {
  businessName: string
  category: string
  address: string | null
  approvalStatus: string
  reviewNote: string | null
}

export default async function BusinessPage() {
  const token = await businessToken()
  if (!token) redirect('/login')

  // When the vendor portal is linked, send people straight to the dashboard —
  // one checklist lives there; don't retell setup on this site.
  if (dashboardPortalLinked()) {
    await openDashboardAction()
  }

  const headers = { Authorization: `Bearer ${token}` }
  let me: { name: string }
  let profile: Profile
  let services: SetupService[]
  let hours: SetupHour[]
  try {
    ;[me, profile, services, hours] = await Promise.all([
      apiFetch<{ name: string }>('/vendor-auth/me', { headers }),
      apiFetch<Profile>('/vendor-admin/profile', { headers }),
      apiFetch<SetupService[]>('/vendor-admin/services', { headers }),
      apiFetch<SetupHour[]>('/vendor-admin/schedule/hours', { headers }),
    ])
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login')
    throw err
  }

  const firstName = me.name.trim().split(/\s+/)[0] ?? ''

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Veno home">
            <Logo />
          </Link>
          <form action={signOutBusinessAction}>
            <button type="submit" className="text-sm font-semibold text-slate-500">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <SetupBoard
          firstName={firstName}
          businessName={profile.businessName}
          category={profile.category}
          area={profile.address}
          approvalStatus={profile.approvalStatus}
          reviewNote={profile.reviewNote}
          services={services}
          hours={hours}
        />
      </div>
    </main>
  )
}
