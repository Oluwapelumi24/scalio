/** Commission from completed sales. `bps` is basis points (4000 = 40%). */
export function commissionFromSales(salesKobo: number, bps: number): number {
  if (salesKobo <= 0 || bps <= 0) return 0
  return Math.floor((salesKobo * bps) / 10_000)
}

/** Inclusive calendar-month bounds for a payroll period `YYYY-MM` (UTC dates). */
export function periodMonthBounds(period: string): { from: string; to: string } {
  const [y, m] = period.split('-').map(Number)
  const from = `${period}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const to = `${period}-${String(last).padStart(2, '0')}`
  return { from, to }
}
