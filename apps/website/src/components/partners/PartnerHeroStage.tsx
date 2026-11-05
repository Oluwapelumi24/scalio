'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { ArrowRight, Check, Dumbbell, Flower2, Lock, MessageCircle, Ruler, Scissors, Shirt, SprayCan } from 'lucide-react'
import { PhoneFrame, VendorHomeScreen } from './VendorPhone'

// A picture of the vendor web dashboard (apps/vendor-web/src/app/dashboard), filled
// with sample data. It keeps the real layout, labels and sidebar, so when those
// change this should change too.

const SIDEBAR = [
  'Home', 'Bookings', 'Services', 'Staff', 'Schedule', 'Customers', 'Attendance', 'Content studio', 'Ads',
  'Inbox', 'Leads', 'Customer feedback', 'Reports', 'Performance', 'Money', 'Payroll', 'Online payments',
]

const VIEWS = ['Home', 'Bookings', 'Money'] as const
type View = (typeof VIEWS)[number]

interface Booking {
  client: string
  service: string
  time: string
  minutes: number
  payment: 'Deposit' | 'Full' | 'On Arrival'
  status: 'confirmed' | 'pending payment'
}

interface Business {
  label: string
  Icon: typeof Scissors
  color: string
  name: string
  slug: string
  stats: { newCustomers: number; sales: string; repeat: string; team: number }
  today: { bookings: number; sales: string }
  bookings: Booking[]
  money: { sales: string; online: string; salaries: string; expenses: string; left: string }
  toasts: Record<View, { title: string; body: string }>
}

const BUSINESSES: Business[] = [
  {
    label: 'Spa',
    Icon: Flower2,
    color: '#059669',
    name: 'Serene Spa',
    slug: 'serene-spa',
    stats: { newCustomers: 38, sales: '₦1,240,000', repeat: '41 of 96', team: 6 },
    today: { bookings: 9, sales: '₦186,000' },
    bookings: [
      { client: 'Femisola A.', service: 'Deep tissue massage', time: '10:00', minutes: 90, payment: 'Deposit', status: 'confirmed' },
      { client: 'Bisi O.', service: 'Couples massage', time: '11:30', minutes: 60, payment: 'Full', status: 'confirmed' },
      { client: 'Ngozi E.', service: 'Signature facial', time: '1:00', minutes: 45, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Tolu B.', service: 'Full spa day', time: '2:30', minutes: 180, payment: 'Deposit', status: 'pending payment' },
    ],
    money: { sales: '₦1,240,000', online: '₦860,000', salaries: '₦380,000', expenses: '₦145,000', left: '₦715,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Femisola booked Deep tissue massage for 10:00.' },
      Bookings: { title: 'Deposit received', body: 'Tolu paid ₦15,000 for Full spa day.' },
      Money: { title: 'Payout sent', body: '₦186,000 is on its way to your bank.' },
    },
  },
  {
    label: 'Tailor',
    Icon: Ruler,
    color: '#c2410c',
    name: 'Stitch & Co.',
    slug: 'stitch-and-co',
    stats: { newCustomers: 24, sales: '₦980,000', repeat: '33 of 71', team: 4 },
    today: { bookings: 7, sales: '₦142,000' },
    bookings: [
      { client: 'Chidi N.', service: 'Agbada fitting', time: '9:30', minutes: 45, payment: 'Deposit', status: 'confirmed' },
      { client: 'Amaka I.', service: 'Aso ebi sewing', time: '11:00', minutes: 60, payment: 'Deposit', status: 'confirmed' },
      { client: 'Seun K.', service: 'Suit alteration', time: '12:30', minutes: 30, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Halima M.', service: 'Bridal fitting', time: '3:00', minutes: 90, payment: 'Full', status: 'pending payment' },
    ],
    money: { sales: '₦980,000', online: '₦610,000', salaries: '₦260,000', expenses: '₦120,000', left: '₦600,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Chidi booked Agbada fitting for 9:30.' },
      Bookings: { title: 'Deposit received', body: 'Amaka paid ₦20,000 for Aso ebi sewing.' },
      Money: { title: 'Payout sent', body: '₦142,000 is on its way to your bank.' },
    },
  },
  {
    label: 'Laundry',
    Icon: Shirt,
    color: '#2563eb',
    name: 'True Wash',
    slug: 'true-wash',
    stats: { newCustomers: 52, sales: '₦720,000', repeat: '88 of 140', team: 5 },
    today: { bookings: 16, sales: '₦94,500' },
    bookings: [
      { client: 'Kunle A.', service: 'Wash, dry & fold', time: '8:00', minutes: 60, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Ifeoma C.', service: 'Duvet wash', time: '9:00', minutes: 90, payment: 'Full', status: 'confirmed' },
      { client: 'Yemi S.', service: 'Native wear dry clean', time: '10:30', minutes: 30, payment: 'Full', status: 'confirmed' },
      { client: 'Musa D.', service: 'Ironing, 10 pieces', time: '12:00', minutes: 45, payment: 'Deposit', status: 'pending payment' },
    ],
    money: { sales: '₦720,000', online: '₦430,000', salaries: '₦180,000', expenses: '₦95,000', left: '₦445,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Kunle booked Wash, dry & fold for 8:00.' },
      Bookings: { title: 'Payment received', body: 'Ifeoma paid ₦12,000 for Duvet wash.' },
      Money: { title: 'Payout sent', body: '₦94,500 is on its way to your bank.' },
    },
  },
  {
    label: 'Pilates',
    Icon: Dumbbell,
    color: '#e11d48',
    name: 'Core Studio',
    slug: 'core-studio',
    stats: { newCustomers: 46, sales: '₦1,560,000', repeat: '62 of 118', team: 7 },
    today: { bookings: 22, sales: '₦264,000' },
    bookings: [
      { client: 'Zainab R.', service: 'Reformer class', time: '7:00', minutes: 50, payment: 'Full', status: 'confirmed' },
      { client: 'Dami F.', service: 'Mat Pilates', time: '8:30', minutes: 50, payment: 'Full', status: 'confirmed' },
      { client: 'Efe J.', service: 'Private session', time: '10:00', minutes: 60, payment: 'Deposit', status: 'confirmed' },
      { client: 'Lola T.', service: 'Intro to reformer', time: '5:30', minutes: 50, payment: 'Full', status: 'pending payment' },
    ],
    money: { sales: '₦1,560,000', online: '₦1,320,000', salaries: '₦420,000', expenses: '₦310,000', left: '₦830,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Zainab booked Reformer class for 7:00.' },
      Bookings: { title: 'Payment received', body: 'Dami paid ₦18,000 for Mat Pilates.' },
      Money: { title: 'Payout sent', body: '₦264,000 is on its way to your bank.' },
    },
  },
  {
    label: 'Barbershop',
    Icon: Scissors,
    color: '#334155',
    name: 'Fade House',
    slug: 'fade-house',
    stats: { newCustomers: 61, sales: '₦840,000', repeat: '104 of 167', team: 5 },
    today: { bookings: 24, sales: '₦118,000' },
    bookings: [
      { client: 'Tobi L.', service: 'Skin fade', time: '9:00', minutes: 40, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Emeka U.', service: 'Haircut and beard trim', time: '9:45', minutes: 45, payment: 'Full', status: 'confirmed' },
      { client: 'Sola G.', service: 'Hot towel shave', time: '11:00', minutes: 30, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Ibrahim Y.', service: 'Kids haircut', time: '12:15', minutes: 30, payment: 'Deposit', status: 'pending payment' },
    ],
    money: { sales: '₦840,000', online: '₦390,000', salaries: '₦310,000', expenses: '₦85,000', left: '₦445,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Tobi booked Skin fade for 9:00.' },
      Bookings: { title: 'Payment received', body: 'Emeka paid ₦9,000 for Haircut and beard trim.' },
      Money: { title: 'Payout sent', body: '₦118,000 is on its way to your bank.' },
    },
  },
  {
    label: 'Home cleaning',
    Icon: SprayCan,
    color: '#15803d',
    name: 'Sparkle Cleaners',
    slug: 'sparkle-cleaners',
    stats: { newCustomers: 29, sales: '₦1,080,000', repeat: '37 of 82', team: 8 },
    today: { bookings: 6, sales: '₦171,000' },
    bookings: [
      { client: 'Funke P.', service: 'Deep clean, 3 bedrooms', time: '8:30', minutes: 240, payment: 'Deposit', status: 'confirmed' },
      { client: 'Obi V.', service: 'Office clean', time: '10:00', minutes: 120, payment: 'Full', status: 'confirmed' },
      { client: 'Rita Q.', service: 'Regular home clean', time: '1:00', minutes: 150, payment: 'On Arrival', status: 'confirmed' },
      { client: 'Bayo H.', service: 'Move-in clean', time: '3:30', minutes: 180, payment: 'Deposit', status: 'pending payment' },
    ],
    money: { sales: '₦1,080,000', online: '₦720,000', salaries: '₦420,000', expenses: '₦160,000', left: '₦500,000' },
    toasts: {
      Home: { title: 'New booking', body: 'Funke booked Deep clean, 3 bedrooms for 8:30.' },
      Bookings: { title: 'Deposit received', body: 'Bayo paid ₦20,000 for Move-in clean.' },
      Money: { title: 'Payout sent', body: '₦171,000 is on its way to your bank.' },
    },
  },
]

const Card = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-xl border border-gray-200 bg-white ${className}`}>{children}</div>
)

const StatusBadge = ({ status }: { status: Booking['status'] }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{status}</span>
)

function HomeView({ b }: { b: Business }) {
  const stats = [
    ['New customers, last 30 days', b.stats.newCustomers],
    ['Sales, last 30 days', b.stats.sales],
    ['Repeat customers', b.stats.repeat],
    ['Team', b.stats.team],
  ] as const
  return (
    <>
      <p className="text-[22px] font-bold text-gray-900">Welcome back, Ada</p>
      <p className="mt-0.5 text-[13px] text-gray-500">Here&apos;s {b.name} today.</p>
      <div className="mt-5 grid grid-cols-4 gap-3">
        {stats.map(([label, value]) => (
          <Card key={label} className="px-4 py-3.5">
            <p className="text-[12px] text-gray-500">{label}</p>
            <p className="mt-1 text-[20px] font-bold text-gray-900">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[1fr_250px] gap-5">
        <div>
          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-[14px] font-bold text-gray-900">Upcoming bookings</p>
              <p className="text-[12px] text-indigo-600">See all</p>
            </div>
            {b.bookings.map((row) => (
              <div key={row.client} className="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-0">
                <span className="w-11 shrink-0 text-[12px] font-semibold text-gray-900">{row.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-900">{row.client}</p>
                  <p className="truncate text-[11px] text-gray-500">{row.service}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </Card>
          <p className="mt-5 text-[14px] font-bold text-gray-900">Suggested for you</p>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <Card className="p-3.5">
              <p className="text-[12px] font-semibold text-gray-900">Take payments online</p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500">Add your bank account so customers can pay deposits online.</p>
            </Card>
            <Card className="p-3.5">
              <p className="text-[12px] font-semibold text-gray-900">Create a post</p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500">Turn a photo of your work into a caption, ready to share.</p>
            </Card>
          </div>
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-900">Quick actions</p>
          <div className="mt-2.5 space-y-2">
            {['Create a post', 'Leads'].map((a) => (
              <Card key={a} className="flex items-center justify-between px-3.5 py-2.5 text-[12px] text-gray-900">{a}<ArrowRight className="h-3.5 w-3.5 text-gray-300" /></Card>
            ))}
            <Card className="p-3.5">
              <p className="text-[12px] font-semibold text-gray-900">Share booking link</p>
              <p className="mt-1 truncate text-[11px] text-gray-500">venohq.com/book/{b.slug}</p>
              <div className="mt-2.5 flex gap-1.5">
                <span className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-center text-[11px] font-medium text-white">Copy link</span>
                <span className="flex-1 rounded-lg border border-gray-200 py-1.5 text-center text-[11px] text-gray-700">WhatsApp</span>
              </div>
            </Card>
            {['Bookings', 'Add a service', 'Customers'].map((a) => (
              <Card key={a} className="flex items-center justify-between px-3.5 py-2.5 text-[12px] text-gray-900">{a}<ArrowRight className="h-3.5 w-3.5 text-gray-300" /></Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function BookingsView({ b }: { b: Business }) {
  return (
    <>
      <p className="text-[22px] font-bold text-gray-900">Bookings</p>
      <Card className="mt-4 inline-flex divide-x divide-gray-200">
        <div className="px-5 py-3"><p className="text-[20px] font-bold text-gray-900">{b.today.bookings}</p><p className="text-[12px] text-gray-500">Today&apos;s bookings</p></div>
        <div className="px-5 py-3"><p className="text-[20px] font-bold text-gray-900">{b.today.sales}</p><p className="text-[12px] text-gray-500">Today&apos;s sales</p></div>
      </Card>
      <div className="mt-4 flex w-fit gap-1 rounded-xl bg-gray-100 p-1 text-[12px] text-gray-500">
        {['All', 'Confirmed', 'Pending Payment', 'Completed', 'Cancelled', 'No Show'].map((t, i) => (
          <span key={t} className={`rounded-lg px-3 py-1.5 ${i === 0 ? 'bg-white font-medium text-gray-900 shadow-sm' : ''}`}>{t}</span>
        ))}
      </div>
      <Card className="mt-4 overflow-hidden">
        <div className="grid grid-cols-[1.35fr_.5fr_.6fr_.7fr_1.1fr_1.55fr] gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          <span>Client</span><span>Time</span><span>Duration</span><span>Payment</span><span>Status</span><span>Actions</span>
        </div>
        {b.bookings.map((row) => (
          <div key={row.client} className="grid grid-cols-[1.35fr_.5fr_.6fr_.7fr_1.1fr_1.55fr] items-center gap-2 border-b border-gray-50 px-4 py-3 text-[12px] text-gray-700 last:border-0">
            <div className="min-w-0"><p className="truncate font-medium text-gray-900">{row.client}</p><p className="truncate text-[11px] text-gray-500">{row.service}</p></div>
            <span>{row.time}</span>
            <span>{row.minutes} min</span>
            <span>{row.payment}</span>
            <span><StatusBadge status={row.status} /></span>
            <span className="flex gap-1 text-[10px] font-medium">
              <span className="rounded bg-green-100 px-1.5 py-1 text-green-700">Complete</span>
              <span className="rounded bg-gray-100 px-1.5 py-1 text-gray-600">No Show</span>
              <span className="rounded bg-red-100 px-1.5 py-1 text-red-600">Cancel</span>
            </span>
          </div>
        ))}
      </Card>
    </>
  )
}

function MoneyView({ b }: { b: Business }) {
  const rows = [
    ['Sales', 'Completed bookings at their booked price', b.money.sales],
    ['Received online', 'Paid to your bank by Paystack', b.money.online],
    ['Salaries paid', null, b.money.salaries],
    ['Expenses', null, b.money.expenses],
  ] as const
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[22px] font-bold text-gray-900">Money</p>
          <p className="mt-0.5 text-[13px] text-gray-500">What came in and went out. Veno records it; the money stays in your bank.</p>
        </div>
        <div className="flex gap-1.5 text-[12px]">
          <span className="rounded-full bg-indigo-600 px-3 py-1.5 font-medium text-white">This month</span>
          <span className="rounded-full border border-gray-200 px-3 py-1.5 text-gray-700">Last month</span>
        </div>
      </div>
      <Card className="mt-5 px-5 py-4">
        <p className="text-[14px] font-bold text-gray-900">This month</p>
        {rows.map(([label, note, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <p className="text-[13px] text-gray-900">{label}</p>
              {note ? <p className="text-[11px] text-gray-500">{note}</p> : null}
            </div>
            <p className="text-[13px] font-bold text-gray-900">{value}</p>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3.5">
          <p className="text-[14px] font-bold text-gray-900">Left over</p>
          <p className="text-[18px] font-bold text-emerald-600">{b.money.left}</p>
        </div>
      </Card>
    </>
  )
}

function DashboardWindow({ business, view, wide, onPick }: { business: Business; view: View; wide: boolean; onPick: (v: View) => void }) {
  // Each notification shows briefly, once per screen.
  const toastKey = `${business.slug}-${view}`
  const [dismissed, setDismissed] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setDismissed(toastKey), 4200)
    return () => clearTimeout(t)
  }, [toastKey])
  const toast = dismissed === toastKey ? null : business.toasts[view]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_40px_90px_-20px_rgba(10,18,48,.65)] ring-1 ring-white/25">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex w-80 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-gray-500 ring-1 ring-gray-200">
          <Lock className="h-2.5 w-2.5" aria-hidden />
          app.venohq.com/dashboard{view === 'Home' ? '' : `/${view.toLowerCase()}`}
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-48 shrink-0 flex-col bg-slate-900">
          <div className="border-b border-slate-700 px-4 py-3.5">
            <p className="text-[15px] font-bold text-white">Veno</p>
            <p className="text-[10px] text-slate-400">Vendor Portal</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={business.slug}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/10 p-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: business.color }}>
                  <business.Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-white">{business.name}</span>
                  <span className="block truncate text-[10px] text-slate-300">{business.label}</span>
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <nav aria-label="Dashboard preview" className="flex-1 space-y-px overflow-hidden px-2.5 py-3">
            {SIDEBAR.map((item) => {
              const pickable = (VIEWS as readonly string[]).includes(item)
              const active = item === view
              const cls = `block w-full rounded-md px-2.5 py-[6.5px] text-left text-[12px] font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-300'}`
              return pickable ? (
                <button key={item} type="button" aria-current={active ? 'page' : undefined} onClick={() => onPick(item as View)} className={`${cls} cursor-pointer ${active ? '' : 'hover:bg-slate-700 hover:text-white'}`}>{item}</button>
              ) : (
                <span key={item} className={cls}>{item}</span>
              )
            })}
          </nav>
        </aside>
        <div className="relative min-w-0 flex-1 overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${view}-${business.slug}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={wide ? 'py-6 pl-6 pr-[116px]' : 'p-6'}
            >
              {view === 'Home' ? <HomeView b={business} /> : view === 'Bookings' ? <BookingsView b={business} /> : <MoneyView b={business} />}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {toast ? (
              <motion.div
                key={toastKey}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1, transition: { delay: 0.9, type: 'spring', stiffness: 260, damping: 22 } }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                className={`absolute top-4 z-10 flex w-64 items-start gap-2.5 rounded-xl bg-slate-900 p-3 text-white shadow-2xl ${wide ? 'right-[116px]' : 'left-4'}`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-900"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /></span>
                <div>
                  <p className="text-[12px] font-semibold">{toast.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{toast.body}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Float({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`absolute z-30 hidden rounded-2xl bg-white/95 p-3.5 text-left shadow-2xl shadow-navy-deep/25 ring-1 ring-black/5 backdrop-blur lg:block ${className}`}>
      {children}
    </div>
  )
}

// Everything is drawn at this size, then scaled to fit, so the window keeps its proportions.
const WINDOW_W = 1080
const WINDOW_H = 700
const CANVAS_W = 1240
const AUTO_ADVANCE_MS = 4000

/** Veno's dashboard rising out of the partners hero, with the phone app in front of it. */
export function PartnerHeroStage() {
  const reduceMotion = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)
  const [businessIndex, setBusinessIndex] = useState(0)
  const [view, setView] = useState<View>('Home')
  const [hovering, setHovering] = useState(false)
  const [touched, setTouched] = useState(false)

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Walks through the business types and screens until the visitor hovers or picks a screen.
  useEffect(() => {
    if (reduceMotion || hovering || touched) return
    const t = setInterval(() => {
      setBusinessIndex((i) => (i + 1) % BUSINESSES.length)
      setView((v) => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length])
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(t)
  }, [reduceMotion, hovering, touched])

  // A slight tilt towards the pointer.
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateY = useSpring(rawX, { stiffness: 120, damping: 20 })
  const rotateX = useSpring(rawY, { stiffness: 120, damping: 20 })

  const w = width ?? 1104
  const wide = w >= 900
  // Wide: the whole picture fits. Narrow: stay readable and let the window run off the edge.
  const scale = wide ? w / CANVAS_W : Math.max(0.52, w / WINDOW_W)
  const phoneScale = wide ? scale * 0.84 : 0.5
  const height = Math.round(WINDOW_H * scale * (wide ? 0.9 : 1))

  const business = BUSINESSES[businessIndex]

  return (
    <div>
      <div
        ref={stage}
        className="relative"
        style={{ height, perspective: 1800, visibility: width === null ? 'hidden' : 'visible' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false)
          rawX.set(0)
          rawY.set(0)
        }}
        onMouseMove={(e) => {
          if (reduceMotion) return
          const box = e.currentTarget.getBoundingClientRect()
          rawX.set(((e.clientX - box.left) / box.width - 0.5) * 5)
          rawY.set(((e.clientY - box.top) / box.height - 0.5) * -4)
        }}
      >
        {/* Colour glowing out from behind the window */}
        <div aria-hidden className="absolute -inset-x-16 -top-10 bottom-0 rounded-full bg-[radial-gradient(closest-side,rgba(129,140,248,.55),rgba(244,114,182,.28)_55%,transparent)] blur-2xl" />

        <motion.div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: WINDOW_W, height: WINDOW_H, scale, rotateX, rotateY }}
        >
          <DashboardWindow
            business={business}
            view={view}
            wide={wide}
            onPick={(v) => {
              setTouched(true)
              setView(v)
            }}
          />
        </motion.div>

        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 z-20"
          style={{ top: wide ? 96 * scale : 126 }}
        >
          <div className="origin-top-right" style={{ transform: `scale(${phoneScale})` }}>
            <PhoneFrame><VendorHomeScreen /></PhoneFrame>
          </div>
        </motion.div>

        <Float className="animate-float -top-4 right-2 w-60">
          <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wash text-navy"><MessageCircle className="h-3.5 w-3.5" aria-hidden /></span>
            AI replied on Instagram
          </p>
          <p className="mt-1.5 text-xs text-slate-600">“We have 10:00 free on Saturday. Shall I hold it for you?”</p>
        </Float>
      </div>
      <p className="sr-only">Preview of the Veno dashboard with sample data.</p>
    </div>
  )
}
