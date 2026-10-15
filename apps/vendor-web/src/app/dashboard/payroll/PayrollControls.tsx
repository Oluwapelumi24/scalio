'use client'

import { useState, useTransition } from 'react'
import { markPaid, saveSchedule, saveStaffPay, skipPayout, startPayroll, transferList } from '@/app/actions/finance'
import { naira, type Bank, type SalaryRun, type TeamPay } from '@/lib/finance'
import { AccountForm } from '../payments/AccountForm'

export function StartButton({ label, disabled }: { label: string; disabled: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => startTransition(async () => { const r = await startPayroll(); setError(r.error ?? null) })}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-gray-200 disabled:text-gray-500"
      >
        {isPending ? 'Starting…' : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function RunTable({ run }: { run: SalaryRun }) {
  const [reveal, setReveal] = useState<SalaryRun | null>(null)
  const [refs, setRefs] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const act = (fn: () => Promise<{ error?: string }>) => startTransition(async () => { const r = await fn(); setError(r.error ?? null) })

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Person</th>
              <th className="px-4 py-2 text-left font-semibold">Pay into</th>
              <th className="px-4 py-2 text-right font-semibold">Amount</th>
              <th className="px-4 py-2 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-900">
            {run.payouts.map((p) => {
              const full = reveal?.payouts.find((x) => x.id === p.id)?.accountNumber
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.staffName}</td>
                  <td className="px-4 py-3 text-gray-600 select-all">{p.bankName} · {full ?? `•••• ${p.accountLast4}`} · {p.accountName}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{naira(p.amountKobo)}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' ? (
                      <span className="inline-flex items-center gap-2">
                        <input
                          value={refs[p.id] ?? ''}
                          onChange={(e) => setRefs({ ...refs, [p.id]: e.target.value })}
                          placeholder="Bank ref (optional)"
                          maxLength={80}
                          className="w-36 rounded-md border border-gray-300 px-2 py-1 text-xs"
                          aria-label={`Transfer reference for ${p.staffName}`}
                        />
                        <button type="button" disabled={isPending} onClick={() => act(() => skipPayout(p.id))} className="text-xs font-medium text-gray-500 hover:text-gray-800">Skip</button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => { if (confirm(`Only mark this paid after sending ${naira(p.amountKobo)} to ${p.staffName} from your bank.`)) act(() => markPaid(p.id, refs[p.id])) }}
                          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Mark paid
                        </button>
                      </span>
                    ) : (
                      <span className={`text-xs font-semibold ${p.status === 'paid' ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {p.status === 'paid' ? `Paid${p.reference ? ` · ${p.reference}` : ''}` : 'Skipped'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {run.status === 'open' && (
        <button
          type="button"
          onClick={() => startTransition(async () => { if (reveal) { setReveal(null); return } const r = await transferList(run.id); if (r.data) setReveal(r.data); else setError(r.error ?? null) })}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {reveal ? 'Hide account numbers' : 'Show account numbers to pay'}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function TeamRow({ member, banks }: { member: TeamPay; banks: Bank[] }) {
  const [salary, setSalary] = useState(member.monthlySalaryKobo ? String(member.monthlySalaryKobo / 100) : '')
  const [editingAccount, setEditingAccount] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const saveSalary = () =>
    startTransition(async () => {
      const n = Number(salary.replace(/,/g, ''))
      if (!Number.isFinite(n) || n < 0) { setMsg({ ok: false, text: 'Enter the salary in naira.' }); return }
      const r = await saveStaffPay(member.staffId, { monthlySalaryKobo: Math.round(n * 100) })
      setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: 'Saved' })
    })
  return (
    <li className="px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-40 flex-1">
          <p className="font-medium text-gray-900">{member.name}</p>
          <p className={`text-sm ${!member.verifiedAt && (member.monthlySalaryKobo ?? 0) > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
            {member.verifiedAt ? `${member.bankName} · •••• ${member.accountLast4} · ${member.accountName}` : (member.monthlySalaryKobo ?? 0) > 0 ? 'Add a bank account' : 'No salary set'}
          </p>
        </div>
        <label className="text-sm text-gray-600">
          ₦ / month
          <input value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" className="ml-2 w-32 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900" aria-label={`Monthly salary for ${member.name}`} />
        </label>
        <button type="button" onClick={saveSalary} disabled={isPending} className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-800">Save</button>
        <button type="button" onClick={() => setEditingAccount((v) => !v)} className="text-sm font-medium text-indigo-600">
          {editingAccount ? 'Cancel' : member.verifiedAt ? 'Change account' : 'Add account'}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
      {editingAccount && (
        <AccountForm banks={banks} saveLabel="Save account" onSave={(bankCode, accountNumber) => saveStaffPay(member.staffId, { bankCode, accountNumber })} />
      )}
    </li>
  )
}

export function ScheduleForm({ payDay, paused, hasSchedule }: { payDay: number; paused: boolean; hasSchedule: boolean }) {
  const [day, setDay] = useState(payDay)
  const [isPaused, setPaused] = useState(paused)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="text-sm text-gray-700">
        Every month on day
        <input type="number" min={1} max={28} value={day} onChange={(e) => setDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))} className="ml-2 w-16 rounded-md border border-gray-300 px-2 py-1 text-sm" />
      </label>
      {hasSchedule && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isPaused} onChange={(e) => setPaused(e.target.checked)} /> Paused
        </label>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => { const r = await saveSchedule(day, isPaused); setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: 'Saved' }) })}
        className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-800"
      >
        {hasSchedule ? 'Save' : 'Set pay day'}
      </button>
      {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</span>}
      <p className="w-full text-xs text-gray-500">Payroll opens 3 days before pay day and closes 5 days after.</p>
    </div>
  )
}
