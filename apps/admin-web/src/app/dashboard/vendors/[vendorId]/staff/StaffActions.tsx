'use client'

import { deleteStaffAction } from '@/app/actions/vendor-staff'

export function StaffActions({ vendorId, staffId }: { vendorId: string; staffId: string }) {
  return (
    <form action={async () => { await deleteStaffAction(vendorId, staffId) }}>
      <button type="submit" className="text-xs text-red-600 hover:text-red-800 font-medium">Remove</button>
    </form>
  )
}
