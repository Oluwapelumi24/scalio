'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  Confirmed: '#10b981',
  Completed: '#6366f1',
  'Pending Payment': '#f59e0b',
  'Cancelled By Customer': '#ef4444',
  'Cancelled By Vendor': '#f97316',
  'No Show': '#94a3b8',
}

const RING_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']

interface Props {
  pieData: Array<{ name: string; value: number }>
  ringData: Array<{ label: string; value: number; color: string }>
  revenueRings: Array<{ name: string; revenue: number; bookings: number }>
  maxRevenue: number
  bookingsTrend: Array<{ day: string; total: number }>
}

function PerformanceRing({ label, value, color }: { label: string; value: number; color: string }) {
  const radius = 40
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx="48" cy="48" r={normalizedRadius}
            stroke="#e5e7eb" strokeWidth={stroke} fill="none"
          />
          {/* Progress */}
          <circle
            cx="48" cy="48" r={normalizedRadius}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{value}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center leading-tight">{label}</p>
    </div>
  )
}

export function DashboardCharts({ pieData, ringData, revenueRings, maxRevenue, bookingsTrend }: Props) {
  const trendData = bookingsTrend.map((d) => ({
    date: new Date(d.day).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
    bookings: Number(d.total),
  }))

  const radialData = revenueRings.map((v, i) => ({
    name: v.name,
    value: Math.round((v.revenue / maxRevenue) * 100),
    fill: RING_COLORS[i % RING_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Row 1: Pie + Performance rings */}
      <div className="grid grid-cols-2 gap-6">
        {/* Booking status pie */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Bookings by status</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No booking data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? '#6366f1'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [(value as number).toLocaleString(), 'Bookings']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance rings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Performance rings</h2>
          <div className="flex items-center justify-around py-2">
            {ringData.map(({ label, value, color }) => (
              <PerformanceRing key={label} label={label} value={value} color={color} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">Calculated from all-time booking data</p>
        </div>
      </div>

      {/* Row 2: Revenue rings (radial bar) + Trend */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue by vendor radial bars */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top vendors by revenue</h2>
          {radialData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius={20} outerRadius={110}
                barSize={14}
                data={radialData}
                startAngle={90} endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={6}
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                />
                <Legend
                  iconSize={10}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
                <Tooltip
                  formatter={(value) => [`${String(value)}% of top revenue`, '']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 30-day trend area chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Booking trend — last 30 days</h2>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No booking data in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [v as number, 'Bookings']}
                />
                <Area
                  type="monotone" dataKey="bookings"
                  stroke="#6366f1" strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
