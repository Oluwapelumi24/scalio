import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { MANAGER_ROLES } from '@/lib/personalisation'
import { PasswordForm } from './PasswordForm'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  practitioner: 'Practitioner',
  front_desk: 'Front Desk',
}

export default async function SettingsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ name: string; email: string | null; role: string }>('/vendor-auth/me', token)
  const isManager = MANAGER_ROLES.includes(me.role)

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Settings</h1>
        <p className="mt-1.5 text-sm text-[#4a4e57]">Your account, payments setup, and home preferences.</p>
      </div>

      <section className="rounded-[20px] border border-[#e4e6eb] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#0a0a0a]">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#7d818b]">Name</dt>
            <dd className="truncate font-medium">{me.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#7d818b]">Email</dt>
            <dd className="truncate font-medium">{me.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#7d818b]">Role</dt>
            <dd className="font-medium">{ROLE_LABELS[me.role] ?? me.role}</dd>
          </div>
        </dl>
      </section>

      {me.email ? <PasswordForm email={me.email} /> : null}

      <section className="rounded-[20px] border border-[#e4e6eb] bg-white p-2">
        <Link href="/dashboard/notifications" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-[#f5f6f8]">
          Notifications
          <span className="text-[#7d818b]">View</span>
        </Link>
        {isManager ? (
          <>
            <Link href="/dashboard/payments" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-[#f5f6f8]">
              Online payments
              <span className="text-[#7d818b]">Setup</span>
            </Link>
            <Link href="/dashboard/interests" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-[#f5f6f8]">
              Home interests
              <span className="text-[#7d818b]">Edit</span>
            </Link>
            <Link href="/dashboard/customise" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-[#f5f6f8]">
              Customise home
              <span className="text-[#7d818b]">Edit</span>
            </Link>
          </>
        ) : null}
      </section>
    </div>
  )
}
