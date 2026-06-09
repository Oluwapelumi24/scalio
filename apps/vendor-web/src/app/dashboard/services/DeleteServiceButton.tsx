'use client'

import { useState, useTransition } from 'react'
import { deleteService } from '@/app/actions/services'

export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span>
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm('Delete this service?')) return
          setError(null)
          startTransition(async () => {
            const result = await deleteService(serviceId)
            if (result?.error) setError(result.error)
          })
        }}
        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  )
}
