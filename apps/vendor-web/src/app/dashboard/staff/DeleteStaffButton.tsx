'use client'

import { useState, useTransition } from 'react'
import { deleteStaff } from '@/app/actions/staff'

export function DeleteStaffButton({ staffId }: { staffId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span>
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm('Remove this staff member?')) return
          setError(null)
          startTransition(async () => {
            const result = await deleteStaff(staffId)
            if (result?.error) setError(result.error)
          })
        }}
        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Removing…' : 'Remove'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  )
}
