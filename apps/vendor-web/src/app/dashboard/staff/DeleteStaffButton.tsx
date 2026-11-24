'use client'

import { useState, useTransition } from 'react'
import { deleteStaff } from '@/app/actions/staff'
import { useAskConfirm } from '@/components/askConfirm'

export function DeleteStaffButton({ staffId }: { staffId: string }) {
  const { askConfirm, dialog } = useAskConfirm()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          void (async () => {
            if (
              !(await askConfirm('Remove this team member?', {
                body: 'They lose access immediately. Past bookings and payroll records stay on file.',
                confirmLabel: 'Remove',
                danger: true,
              }))
            )
              return
            setError(null)
            startTransition(async () => {
              const result = await deleteStaff(staffId)
              if (result && 'error' in result) setError(result.error)
            })
          })()
        }}
        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Removing…' : 'Remove'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      {dialog}
    </span>
  )
}
