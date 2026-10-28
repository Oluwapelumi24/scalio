import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { InboxSettings } from '@/lib/inbox'
import { InboxSettingsForm } from './InboxSettingsForm'

/** AI replies per channel, and the FAQ the AI answers from. */
export default async function InboxSettingsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard/inbox')

  let settings: InboxSettings | null = null
  let error: string | null = null
  try {
    settings = await apiFetch<InboxSettings>('/vendor-admin/inbox/settings', token)
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    error = err.message
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/inbox" className="text-sm text-indigo-900 hover:underline">← Inbox</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">AI replies</h1>
        <p className="mt-1 text-sm text-gray-500">
          The AI only answers from your services, prices, hours and the FAQ below — and only within 24 hours of a customer’s message.
        </p>
      </div>
      {error && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">{error}</p>}
      {settings && <InboxSettingsForm settings={settings} />}
    </div>
  )
}
