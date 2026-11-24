'use client'

import { useTransition } from 'react'
import { deleteStaffAction } from '@/app/actions/vendor-staff'
import { useAskConfirm } from '@/components/askConfirm'

export function StaffActions({ vendorId, staffId, name }: { vendorId: string; staffId: string; name: string }) {
  const { askConfirm, dialog } = useAskConfirm()
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    void (async () => {
      if (!(await askConfirm(`Remove ${name} from this vendor's staff? This cannot be undone.`, 'Remove'))) return
      startTransition(() => deleteStaffAction(vendorId, staffId))
    })()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-40"
      >
        {pending ? 'Removing…' : 'Remove'}
      </button>
      {dialog}
    </>
  )
}
