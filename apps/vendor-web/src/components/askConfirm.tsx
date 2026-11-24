'use client'

import { useEffect, useState } from 'react'

type Ask = { message: string; confirmLabel: string; resolve: (ok: boolean) => void }

/** In-app confirmation. The browser's own confirm box titles itself with the site hostname. */
export function useAskConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null)

  function askConfirm(message: string, confirmLabel = 'Continue') {
    return new Promise<boolean>((resolve) => {
      setAsk({ message, confirmLabel, resolve })
    })
  }

  function close(ok: boolean) {
    ask?.resolve(ok)
    setAsk(null)
  }

  useEffect(() => {
    if (!ask) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ask])

  const dialog = ask ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => close(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-confirm-message"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="ask-confirm-message" className="text-sm leading-6 text-[#0a0a0a]">{ask.message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-[#4a4e57]" onClick={() => close(false)}>
            Cancel
          </button>
          <button type="button" className="rounded-full bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white" onClick={() => close(true)}>
            {ask.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { askConfirm, dialog }
}
