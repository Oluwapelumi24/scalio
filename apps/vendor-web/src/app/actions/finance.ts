'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, apiFetch } from '@/lib/api'
import { requireToken } from '@/lib/session'
import type { SalaryRun } from '@/lib/finance'

export type FinanceState = { error: string } | null

async function call<T = unknown>(path: string, init: RequestInit, paths: string[]): Promise<{ data?: T; error?: string }> {
  const token = await requireToken()
  try {
    const data = await apiFetch<T>(path, token, init)
    for (const p of paths) revalidatePath(p)
    return { data }
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message }
    throw err
  }
}

export async function checkAccount(bankCode: string, accountNumber: string) {
  return call<{ accountName: string }>('/vendor-admin/payments/resolve-account', { method: 'POST', body: JSON.stringify({ bankCode, accountNumber }) }, [])
}

export async function savePayoutAccount(bankCode: string, accountNumber: string) {
  return call('/vendor-admin/payments/account', { method: 'PUT', body: JSON.stringify({ bankCode, accountNumber }) }, ['/dashboard/payments', '/dashboard'])
}

export async function saveSchedule(payDay: number, paused: boolean) {
  return call('/vendor-admin/payroll/schedule', { method: 'PUT', body: JSON.stringify({ payDay, paused }) }, ['/dashboard/payroll', '/dashboard'])
}

export async function saveStaffPay(staffId: string, data: { monthlySalaryKobo?: number; bankCode?: string; accountNumber?: string }) {
  return call(`/vendor-admin/payroll/staff/${staffId}`, { method: 'PUT', body: JSON.stringify(data) }, ['/dashboard/payroll'])
}

export async function startPayroll() {
  return call('/vendor-admin/payroll/runs', { method: 'POST' }, ['/dashboard/payroll', '/dashboard'])
}

export async function markPaid(payoutId: string, reference?: string) {
  return call(`/vendor-admin/payroll/payouts/${payoutId}/paid`, { method: 'POST', body: JSON.stringify(reference ? { reference } : {}) }, ['/dashboard/payroll', '/dashboard/money', '/dashboard'])
}

export async function skipPayout(payoutId: string) {
  return call(`/vendor-admin/payroll/payouts/${payoutId}/skip`, { method: 'POST', body: '{}' }, ['/dashboard/payroll', '/dashboard'])
}

/** Full account numbers for paying from the bank — fetched only when asked for. */
export async function transferList(runId: string) {
  return call<SalaryRun>(`/vendor-admin/payroll/runs/${runId}/transfer-list`, { method: 'GET' }, [])
}

export async function addExpense(_prev: FinanceState, formData: FormData): Promise<FinanceState> {
  const naira = Number(String(formData.get('amount') ?? '').replace(/,/g, ''))
  if (!naira || naira <= 0) return { error: 'Enter the amount in naira.' }
  const r = await call('/vendor-admin/money/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amountKobo: Math.round(naira * 100),
      category: formData.get('category'),
      spentOn: formData.get('spentOn'),
      note: (formData.get('note') as string) || undefined,
    }),
  }, ['/dashboard/money'])
  return r.error ? { error: r.error } : null
}

export async function voidExpense(id: string) {
  return call(`/vendor-admin/money/expenses/${id}/void`, { method: 'POST', body: '{}' }, ['/dashboard/money'])
}
