// Types for the Phase 3 money API. Scalio never holds funds — online payments
// settle to the vendor's bank, salaries are paid from the owner's bank.

export interface Bank { name: string; code: string }
export interface PayoutAccount { bankName: string; accountLast4: string; accountName: string; onlinePaymentsEnabled: boolean; verifiedAt: string }
export interface SalaryWindow { state: 'not_set_up' | 'paused' | 'open' | 'closed'; period: string | null; payDate: string | null; opensOn: string | null; closesOn: string | null; reason: string }
export interface TeamPay { staffId: string; name: string; role: string; monthlySalaryKobo: number | null; bankName: string | null; accountLast4: string | null; accountName: string | null; verifiedAt: string | null }
export interface SalaryPayout { id: string; staffName: string; amountKobo: number; bankName: string; accountLast4: string; accountName: string; accountNumber?: string; status: 'pending' | 'paid' | 'skipped'; reference: string | null; paidAt: string | null }
export interface SalaryRun { id: string; period: string; status: 'open' | 'completed'; totalKobo: number; paidKobo: number; payouts: SalaryPayout[] }
export interface PayrollOverview {
  schedule: { payDay: number; opensDaysBefore: number; closesDaysAfter: number; paused: boolean } | null
  window: SalaryWindow
  team: TeamPay[]
  totals: { monthlyKobo: number; people: number }
  canStart: boolean
  blockedReason: string | null
  currentRun: SalaryRun | null
}
export interface MoneySummary { from: string; to: string; salesKobo: number; receivedOnlineKobo: number; salariesKobo: number; expensesKobo: number; netKobo: number }
export interface LedgerEntry { id: string; kind: string; direction: 'in' | 'out'; amountKobo: number; occurredAt: string; description: string }
export interface Expense { id: string; amountKobo: number; category: string; spentOn: string; note: string | null }

export const naira = (kobo: number) => `₦${(kobo / 100 || 0).toLocaleString('en-NG')}`

export function periodLabel(period: string) {
  const [y, m] = period.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
