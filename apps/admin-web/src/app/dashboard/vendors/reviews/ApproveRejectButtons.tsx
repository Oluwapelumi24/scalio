'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { approveVendorAction, rejectVendorAction } from '@/app/actions/vendors'

interface Props {
  vendorId: string
  vendorName: string
  manageHref?: string
}

export function ApproveRejectButtons({ vendorId, vendorName: _vendorName, manageHref }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)

  const [rejectState, rejectAction, rejectPending] = useActionState(rejectVendorAction, null)

  async function handleApprove() {
    setApproving(true)
    const result = await approveVendorAction(vendorId)
    setApproving(false)
    if (!result) setApproved(true)
  }

  if (approved) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Approved
        </span>
        {manageHref && (
          <Link href={manageHref} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Manage →
          </Link>
        )}
      </div>
    )
  }

  if (rejected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Rejected
      </span>
    )
  }

  if (showRejectForm) {
    return (
      <form
        action={async (fd) => {
          fd.set('vendorId', vendorId)
          await rejectAction(fd)
          setRejected(true)
        }}
        className="flex flex-col gap-2 min-w-[240px]"
      >
        <textarea
          name="note"
          placeholder="Reason for rejection (optional — sent to owner)"
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        {rejectState?.error && (
          <p className="text-xs text-red-600">{rejectState.error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={rejectPending}
            className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            {rejectPending ? 'Rejecting…' : 'Confirm reject'}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(false)}
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={approving}
        className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
      >
        {approving ? 'Approving…' : '✓ Approve'}
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        className="px-4 py-1.5 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50"
      >
        Reject
      </button>
    </div>
  )
}
