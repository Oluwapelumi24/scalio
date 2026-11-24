import { commissionFromSales, periodMonthBounds } from './commission'

describe('commissionFromSales', () => {
  it('takes a percent of sales in basis points', () => {
    expect(commissionFromSales(1_000_000, 4000)).toBe(400_000) // 40% of ₦10,000
  })

  it('floors fractional kobo', () => {
    expect(commissionFromSales(100, 3333)).toBe(33)
  })

  it('is zero when rate or sales are zero', () => {
    expect(commissionFromSales(0, 4000)).toBe(0)
    expect(commissionFromSales(1_000_000, 0)).toBe(0)
  })
})

describe('periodMonthBounds', () => {
  it('covers the full calendar month', () => {
    expect(periodMonthBounds('2026-11')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodMonthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
})
