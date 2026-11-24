'use client'

import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inviteAdminAction } from '@/app/actions/team'

/** Header trigger + invite modal. Form stays off-page until Add member is clicked. */
export function InviteAdminButton() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => setMounted(true), [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Add member
      </button>
      {mounted && open ? createPortal(<InviteModal onClose={close} />, document.body) : null}
    </>
  )
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(inviteAdminAction, null)
  const titleId = useId()
  const bodyId = useId()
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    if (state?.ok) onClose()
  }, [state, onClose])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!pending) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative z-10 w-full max-w-[24rem] rounded-2xl bg-white p-5 text-left shadow-xl sm:p-6"
      >
        <h2 id={titleId} className="text-base font-semibold text-gray-900">
          Invite team member
        </h2>
        <p id={bodyId} className="mt-1 text-sm leading-6 text-gray-500">
          They&apos;ll get an email with a link to set their password.
        </p>

        <form action={formAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="invite-name" className="mb-1.5 block text-xs font-medium text-gray-600">
              Full name
            </label>
            <input
              ref={nameRef}
              id="invite-name"
              name="name"
              required
              autoComplete="name"
              placeholder="Ada Lovelace"
              disabled={pending}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="invite-email" className="mb-1.5 block text-xs font-medium text-gray-600">
              Email address
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ada@veno.app"
              disabled={pending}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
