import { redirect } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { Bank, PayoutAccount } from '@/lib/finance'
import { AccountForm } from './AccountForm'

export default async function PaymentsPage() {
  const token = await requireToken()
  const me = await apiFetch<{ role: string }>('/vendor-auth/me', token)
  if (me.role !== 'owner' && me.role !== 'manager') redirect('/dashboard')
  const [account, banks] = await Promise.all([
    apiFetch<PayoutAccount | null>('/vendor-admin/payments/account', token),
    apiFetch<Bank[]>('/vendor-admin/payments/banks', token).catch(() => [] as Bank[]),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Online payments</h1>
        <p className="text-sm text-gray-500 mt-1">Where customers&apos; deposits and online payments go.</p>
      </div>
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-gray-800">
        Paystack pays customers&apos; money straight into your bank account. Scalio never holds it.
      </p>
      {account && (
        <section className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-500">Paid into</p>
          <p className="text-lg font-semibold text-gray-900">{account.accountName}</p>
          <p className="text-sm text-gray-500">{account.bankName} · •••• {account.accountLast4}</p>
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${account.onlinePaymentsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {account.onlinePaymentsEnabled ? 'Online payments on' : 'Waiting for Paystack'}
          </span>
        </section>
      )}
      {me.role === 'owner' ? (
        <section className="bg-white rounded-xl border border-gray-200 px-5 py-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{account ? 'Change account' : 'Add your account'}</h2>
          {banks.length === 0 ? <p className="text-sm text-gray-500">Bank list unavailable right now. Please try again later.</p> : <AccountForm banks={banks} />}
        </section>
      ) : (
        <p className="text-sm text-gray-500">Only the business owner can change the account payments go to.</p>
      )}
    </div>
  )
}
