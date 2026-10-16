'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { convertLead, createLead, deleteLead, updateLead } from '@/app/actions/growth'
import { LEAD_SOURCE_LABELS, type Lead, type LeadSource } from '@/lib/growth'

const SOURCES = Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]
const input = 'mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm'

/** 10am, `days` from today, in the viewer's time zone. */
const at10 = (days: number) => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 10).toISOString()
}

interface Staff { id: string; name: string }

function useAction() {
  const [isPending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<{ error?: string }>, after?: () => void) => {
    setError(null)
    start(async () => {
      const r = await fn()
      if (r.error) setError(r.error)
      else after?.()
    })
  }
  return { isPending, error, run }
}

export function AddLeadForm({ staff }: { staff: Staff[] }) {
  const router = useRouter()
  const { isPending, error, run } = useAction()
  const [key, setKey] = useState(0)

  return (
    <form
      key={key}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const name = String(f.get('name') ?? '').trim()
        const str = (k: string) => String(f.get(k) ?? '').trim() || undefined
        run(
          () => createLead({ name, phone: str('phone'), email: str('email'), source: f.get('source') as LeadSource, note: str('note'), assignedStaffId: str('assignedStaffId'), followUpAt: at10(1) }),
          () => { setKey((k) => k + 1); router.refresh() },
        )
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <label className="text-sm text-gray-700">Name<input name="name" required maxLength={120} className={input} /></label>
      <label className="text-sm text-gray-700">Where did they find you?
        <select name="source" defaultValue="instagram" className={input}>
          {SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>)}
        </select>
      </label>
      <label className="text-sm text-gray-700">Phone<input name="phone" type="tel" placeholder="0801 234 5678" className={input} /></label>
      <label className="text-sm text-gray-700">Email<input name="email" type="email" placeholder="Optional" className={input} /></label>
      {staff.length > 1 && (
        <label className="text-sm text-gray-700">Who&apos;s following up?
          <select name="assignedStaffId" defaultValue="" className={input}>
            <option value="">Nobody yet</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <label className="text-sm text-gray-700 sm:col-span-2">Notes<input name="note" maxLength={1000} placeholder="What are they interested in?" className={input} /></label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isPending ? 'Adding…' : 'Add lead'}
        </button>
        <p className="text-xs text-gray-500">We&apos;ll remind you to follow up tomorrow.</p>
      </div>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-red-600">{error}</p>}
    </form>
  )
}

export function LeadActions({ lead, canDelete }: { lead: Lead; canDelete: boolean }) {
  const router = useRouter()
  const { isPending, error, run } = useAction()
  const open = lead.status === 'new' || lead.status === 'contacted'
  const btn = 'rounded-lg border border-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-40'

  return (
    <section className="space-y-3">
      {open && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-700">Follow up:</span>
            {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([label, days]) => (
              <button key={label} type="button" disabled={isPending} className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
                onClick={() => run(() => updateLead(lead.id, { followUpAt: at10(days as number), ...(lead.status === 'new' ? { status: 'contacted' as const } : {}) }))}>
                {label}
              </button>
            ))}
            {lead.followUpAt && (
              <button type="button" disabled={isPending} className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700" onClick={() => run(() => updateLead(lead.id, { followUpAt: null }))}>
                No follow-up
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {lead.status === 'new' && <button type="button" disabled={isPending} className={btn} onClick={() => run(() => updateLead(lead.id, { status: 'contacted' }))}>Mark contacted</button>}
            <button type="button" disabled={isPending} className={btn} onClick={() => run(() => updateLead(lead.id, { status: 'lost', followUpAt: null }))}>Not interested</button>
            <button type="button" disabled={isPending} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              onClick={() => {
                if (confirm(`Add ${lead.name} as a customer? If they're already a customer with the same phone or email, we'll link to that record instead.`)) run(() => convertLead(lead.id))
              }}>
              They booked — add as a customer
            </button>
          </div>
        </>
      )}
      {lead.status === 'lost' && (
        <button type="button" disabled={isPending} className={btn} onClick={() => run(() => updateLead(lead.id, { status: 'contacted' }))}>Reopen</button>
      )}
      {canDelete && (
        <button type="button" disabled={isPending} className="block text-sm font-medium text-red-600 hover:text-red-800"
          onClick={() => { if (confirm('Delete this lead? This can’t be undone.')) run(() => deleteLead(lead.id), () => router.push('/dashboard/leads')) }}>
          Delete lead
        </button>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  )
}

export function LeadEditForm({ lead, staff, canAssign }: { lead: Lead; staff: Staff[]; canAssign: boolean }) {
  const { isPending, error, run } = useAction()
  const [saved, setSaved] = useState(false)

  return (
    <form
      onChange={() => setSaved(false)}
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const str = (k: string) => String(f.get(k) ?? '').trim() || null
        run(
          () => updateLead(lead.id, {
            name: String(f.get('name') ?? '').trim(), phone: str('phone'), email: str('email'), source: f.get('source') as LeadSource, note: str('note'),
            ...(canAssign ? { assignedStaffId: str('assignedStaffId') } : {}),
          }),
          () => setSaved(true),
        )
      }}
      className="grid gap-3"
    >
      <label className="text-sm text-gray-700">Name<input name="name" required maxLength={120} defaultValue={lead.name} className={input} /></label>
      <label className="text-sm text-gray-700">Phone<input name="phone" type="tel" defaultValue={lead.phone ?? ''} className={input} /></label>
      <label className="text-sm text-gray-700">Email<input name="email" type="email" defaultValue={lead.email ?? ''} className={input} /></label>
      <label className="text-sm text-gray-700">Where did they find you?
        <select name="source" defaultValue={lead.source} className={input}>
          {SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>)}
        </select>
      </label>
      {canAssign && staff.length > 1 && (
        <label className="text-sm text-gray-700">Who&apos;s following up?
          <select name="assignedStaffId" defaultValue={lead.assignedStaff?.id ?? ''} className={input}>
            <option value="">Nobody yet</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}
      <label className="text-sm text-gray-700">Notes<textarea name="note" rows={3} maxLength={1000} defaultValue={lead.note ?? ''} className={input} /></label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isPending ? 'Saving…' : 'Save changes'}</button>
        {saved && <span role="status" className="text-sm text-emerald-700">Saved.</span>}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
