'use client'

import { useTransition } from 'react'
import { removeAdminAction } from '@/app/actions/team'
import { useAskConfirm } from '@/components/askConfirm'

export function RemoveAdminButton({ adminId }: { adminId: string }) {
  const { askConfirm, dialog } = useAskConfirm()
  const [pending, startTransition] = useTransition()
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          void (async () => {
            if (!(await askConfirm('Remove this team member?', 'Remove'))) return
            startTransition(async () => { await removeAdminAction(adminId) })
          })()
        }}
        className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
      >
        {pending ? '…' : 'Remove'}
      </button>
      {dialog}
    </>
  )
}
