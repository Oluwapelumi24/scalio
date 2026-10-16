import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { SocialConnections } from '@/lib/growth'
import { ConnectButtons } from './ConnectButtons'

const ROWS = [
  { platform: 'facebook' as const, name: 'Facebook Page' },
  { platform: 'instagram' as const, name: 'Instagram' },
]

export default async function ConnectionsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role === 'practitioner') redirect('/dashboard')
  const data = await apiFetch<SocialConnections>('/vendor-admin/social/connections', token)
  const canManage = me.role === 'owner' || me.role === 'manager'
  const needsReconnect = data.connections.some((c) => c.status === 'needs_reconnect')

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/content" className="text-sm text-indigo-600">← Content studio</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Social accounts</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your business accounts to publish and schedule posts straight from Scalio.</p>
      </div>

      <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {ROWS.map((r) => {
          const c = data.connections.find((x) => x.platform === r.platform)
          return (
            <li key={r.platform} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                <p className={`text-xs ${c?.status === 'needs_reconnect' ? 'text-red-600' : 'text-gray-500'}`}>
                  {c ? (c.status === 'active' ? `Connected: ${c.displayName}` : `Needs reconnecting: ${c.displayName}`) : 'Not connected'}
                </p>
              </div>
              {c?.status === 'active' && <span className="text-emerald-600 text-sm font-medium">✓</span>}
            </li>
          )
        })}
      </ul>

      {!data.available ? (
        <p className="text-sm text-gray-600">{data.unavailableReason} Until then, copy captions from the content studio and post from each app.</p>
      ) : !canManage ? (
        <p className="text-sm text-gray-600">Ask an owner or manager to connect or change accounts.</p>
      ) : (
        <ConnectButtons label={data.connections.length === 0 ? 'Connect Facebook & Instagram' : needsReconnect ? 'Reconnect' : 'Change Page'} connected={data.connections.length > 0} />
      )}

      <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-gray-600">
        <p className="font-semibold text-gray-900">TikTok and WhatsApp</p>
        <p>TikTok is waiting on TikTok’s approval. WhatsApp doesn’t let apps post to Status. For both, copy the caption from the content studio.</p>
      </div>
    </div>
  )
}
