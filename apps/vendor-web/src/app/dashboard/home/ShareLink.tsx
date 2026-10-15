'use client'

import { useState } from 'react'
import { recordModuleUsage } from '@/app/actions/personalisation'

export function ShareLink({ moduleId, url }: { moduleId: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const message = `Book an appointment with us on Scalio: ${url}`

  async function copy() {
    void recordModuleUsage(moduleId)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the link is visible to copy by hand */
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-900">Share booking link</p>
      <p className="text-xs text-gray-500 mt-1 truncate" title={url}>{url}</p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={copy}
          className="flex-1 text-sm font-medium rounded-lg bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-700"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void recordModuleUsage(moduleId)}
          className="flex-1 text-center text-sm font-medium rounded-lg border border-gray-300 text-gray-700 px-3 py-1.5 hover:bg-gray-50"
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}
