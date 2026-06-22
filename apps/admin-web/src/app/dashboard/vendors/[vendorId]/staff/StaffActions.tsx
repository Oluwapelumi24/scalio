'use client'

import { useTransition } from 'react'
import { deleteStaffAction } from '@/app/actions/vendor-staff'

export function StaffActions({ vendorId, staffId, name }: { vendorId: string; staffId: string; name: string }) {
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    if (!confirm(`Remove ${name} from this vendor's staff? This cannot be undone.`)) return
    startTransition(() => deleteStaffAction(vendorId, staffId))
  }

  return (
    <button
      onClick={handleRemove}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-40"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}
