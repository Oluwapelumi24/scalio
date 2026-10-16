'use client'

import { useState, useTransition } from 'react'
import { disconnectMeta, metaConnectUrl } from '@/app/actions/growth'

export function ConnectButtons({ label, connected }: { label: string; connected: boolean }) {
  const [isPending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => start(async () => {
          setError(null)
          const r = await metaConnectUrl()
          if (r.error || !r.data) setError(r.error ?? 'Could not start connecting.')
          else window.location.href = r.data.url
        })}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? 'Opening Facebook…' : label}
      </button>
      <p className="text-xs text-gray-500">
        You&apos;ll log in with Facebook and choose your business Page. Instagram connects too if it&apos;s a business or creator account linked to that Page. Scalio never sees your password.
      </p>
      {connected && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm('Disconnect Facebook and Instagram? Scheduled posts to them won’t go out. Posts already published stay up.')) {
              start(async () => { const r = await disconnectMeta(); if (r.error) setError(r.error) })
            }
          }}
          className="block text-sm font-medium text-red-600 hover:text-red-800"
        >
          Disconnect
        </button>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
