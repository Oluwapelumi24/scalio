import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { openDashboardAction, signOutBusinessAction } from '@/app/actions/vendor'
import { Logo } from '@/components/Navbar'
import { OpenDashboardButton } from '@/components/partners/OpenDashboardButton'
import { SetupBoard, type SetupHour, type SetupService } from '@/components/partners/SetupBoard'
import { ApiError, apiFetch } from '@/lib/api'
import { businessToken } from '@/lib/business-session'
import { dashboardLoginUrl, dashboardPortalLinked } from '@/lib/vendor-portal'

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

/**
 * Legacy fallback only. When the seller portal is linked, always hand off.
 * When setup is already complete, do not re-show the checklist — point at the dashboard.
 */
export default async function BusinessPage() {
  const token = await businessToken()
  if (!token) redirect('/login')

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
  const setupComplete = services.length > 0 && hours.length > 0

  // P2: checklist is only for unfinished setup without a linked portal.
  if (setupComplete) {
    return (
      <Shell>
        <PortalMissing
          firstName={firstName}
          businessName={profile.businessName}
          approvalStatus={profile.approvalStatus}
        />
      </Shell>
    )
  }

  return (
    <Shell>
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
      <p className="mt-6 text-center text-sm text-slate-500">
        Prefer the full dashboard?{' '}
        <Link href={dashboardLoginUrl()} className="font-semibold text-navy">
          Open seller sign-in
        </Link>
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
    </main>
  )
}

/** Shown only when setup is done but VENDOR_WEB_URL is still missing on Vercel. */
function PortalMissing({
  firstName,
  businessName,
  approvalStatus,
}: {
  firstName: string
  businessName: string
  approvalStatus: string
}) {
  const pending = approvalStatus === 'pending_review'
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold text-navy">You’re in</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-slate-950">
        {firstName ? `Welcome, ${firstName}` : 'Welcome'}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-600">
        {businessName} is set up
        {pending ? '. We’ll review the listing before customers can book.' : '.'} Open the
        business dashboard to keep going.
      </p>
      <div className="mt-6">
        <OpenDashboardButton />
      </div>
      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
        If this button fails, set <span className="font-mono text-slate-700">VENDOR_WEB_URL</span> on
        the website (Vercel) to your Railway vendor-web HTTPS address, then redeploy. See{' '}
        <span className="font-mono">GO_LIVE_ENV.md</span>.
      </p>
    </div>
  )
}
