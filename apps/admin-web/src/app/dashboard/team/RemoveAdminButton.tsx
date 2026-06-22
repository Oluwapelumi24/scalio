'use client'

import { useTransition } from 'react'
import { removeAdminAction } from '@/app/actions/team'

export function RemoveAdminButton({ adminId }: { adminId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('Remove this team member?')) return
        startTransition(async () => { await removeAdminAction(adminId) })
      }}
      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
    >
      {pending ? '…' : 'Remove'}
    </button>
  )
}
