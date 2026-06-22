'use client'

interface RevenueReport {
  totalRevenueKobo: number
  totalBookings: number
  byVendor: Array<{ vendorId: string; businessName: string; revenueKobo: string | null; bookingCount: number }>
  statusBreakdown: Record<string, number>
}

export function ExportButton({ report, periodLabel }: { report: RevenueReport; periodLabel: string }) {
  function handleExport() {
    const rows = [
      ['Scalio Revenue Report', periodLabel],
      [],
      ['Summary'],
      ['Total Revenue', `₦${(report.totalRevenueKobo / 100).toLocaleString('en-NG')}`],
      ['Completed Bookings', String(report.totalBookings)],
      [],
      ['Revenue by Vendor'],
      ['Vendor', 'Revenue (₦)', 'Bookings'],
      ...report.byVendor.map((v) => [
        v.businessName,
        (Number(v.revenueKobo ?? 0) / 100).toFixed(2),
        String(v.bookingCount),
      ]),
      [],
      ['Booking Status Breakdown'],
      ['Status', 'Count'],
      ...Object.entries(report.statusBreakdown).map(([s, n]) => [s.replace(/_/g, ' '), String(n)]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scalio-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span>↓</span> Export CSV
    </button>
  )
}
