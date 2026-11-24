import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import { naira, periodLabel, type Bank, type PayrollOverview } from '@/lib/finance'
import { RunTable, ScheduleForm, StartButton, TeamRow } from './PayrollControls'

const BANNER: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  closed: 'bg-gray-50 text-gray-700 border-gray-200',
  paused: 'bg-amber-50 text-amber-800 border-amber-200',
  not_set_up: 'bg-blue-50 text-blue-900 border-blue-200',
}

export default async function PayrollPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard')
  const [o, banks] = await Promise.all([
    apiFetch<PayrollOverview>('/vendor-admin/payroll', token),
    apiFetch<Bank[]>('/vendor-admin/payments/banks', token).catch(() => [] as Bank[]),
  ])
  const run = o.currentRun
  const allPaid = run?.status === 'completed'

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set salaries and commissions, pay from your bank, then record it here. Commission uses completed bookings in the payroll month.
        </p>
      </div>

      <div className={`rounded-xl border px-5 py-4 ${allPaid ? BANNER.open : BANNER[o.window.state]}`}>
        <p className="font-semibold">
          {allPaid ? 'Everyone is paid' : { open: 'Payroll is open', closed: 'Payroll is closed', paused: 'Payroll is paused', not_set_up: 'Set your pay day' }[o.window.state]}
          {o.window.state === 'open' && o.window.period ? ` · ${periodLabel(o.window.period)}` : ''}
        </p>
        <p className="text-sm mt-0.5">{allPaid && run ? `${periodLabel(run.period)} salaries are all recorded as paid.` : o.window.reason}</p>
      </div>

      <section className="space-y-3">
        {run ? (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-gray-900">{periodLabel(run.period)}</h2>
              <p className="text-sm text-gray-500">{naira(run.paidKobo)} of {naira(run.totalKobo)} paid</p>
            </div>
            <RunTable run={run} />
          </>
        ) : (
          <>
            <StartButton
              disabled={!o.canStart}
              label={
                o.window.state === 'open' && o.window.period
                  ? `Start ${periodLabel(o.window.period)} payroll · ${naira(o.totals.monthlyKobo)}`
                  : 'Start payroll'
              }
            />
            {o.window.state === 'open' && o.totals.people > 0 ? (
              <p className="text-xs text-gray-500">
                {naira(o.totals.salaryKobo)} salary
                {o.totals.commissionKobo > 0 ? ` · ${naira(o.totals.commissionKobo)} commission` : ''}
              </p>
            ) : null}
            {o.blockedReason && o.window.state === 'open' && <p className="text-sm text-amber-700">{o.blockedReason}</p>}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Team pay</h2>
        <ul className="divide-y divide-gray-100 rounded-[20px] bg-white">
          {o.team.map((m) => (
            <TeamRow key={m.staffId} member={m} banks={banks} />
          ))}
        </ul>
        <p className="text-xs text-gray-500">
          Commission is a percent of each person&apos;s completed bookings this month. Account numbers are encrypted and only shown in full when you&apos;re paying.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Pay day</h2>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <ScheduleForm payDay={o.schedule?.payDay ?? 25} paused={o.schedule?.paused ?? false} hasSchedule={!!o.schedule} />
        </div>
      </section>
    </div>
  )
}
