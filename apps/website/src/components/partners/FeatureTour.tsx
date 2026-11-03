'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BarChart3, CalendarDays, Check, Inbox, Megaphone, Sparkles, Star, Users, Wallet } from 'lucide-react'

// One tab per part of the vendor app, in the order a business meets them during a day.
const TABS = [
  {
    key: 'calendar',
    label: 'Calendar',
    Icon: CalendarDays,
    title: 'The whole day, at a glance',
    body: 'Every booking for every team member, side by side. See what today should bring in, how much time is still free for a walk-in, and who is next.',
    points: ['Tap any free time to book a walk-in or a call', 'Bookings at the same time sit side by side', 'Deposits and unpaid bookings marked on each one'],
  },
  {
    key: 'inbox',
    label: 'Inbox',
    Icon: Inbox,
    title: 'Instagram, WhatsApp and Messenger in one inbox',
    body: 'Answer every DM from one place. AI drafts replies about prices and free times, and hands the chat to you when a client is unhappy or asks for a person.',
    points: ['AI suggests or sends replies, your choice', 'Your FAQ answers the common questions', '"A chat needs you" alerts when it matters'],
  },
  {
    key: 'clients',
    label: 'Clients',
    Icon: Users,
    title: 'Know every client by name',
    body: 'Every client who has booked, how often they come back and what they spent. Add notes like "prefers Chidi" or "allergic to latex".',
    points: ['Returning walk-ins matched by phone number', 'Visit history and notes in one place', 'See who is due back and invite them'],
  },
  {
    key: 'money',
    label: 'Money',
    Icon: Wallet,
    title: 'Fewer no-shows, cleaner books',
    body: 'Take deposits or full payment when clients book, and see what came in today, this week and this month. Payroll for your team is built in.',
    points: ['Deposits and prepayments per service', 'Payouts straight to your bank account', 'Staff pay and commission worked out for you'],
  },
  {
    key: 'grow',
    label: 'Grow',
    Icon: Megaphone,
    title: 'Get found, get booked again',
    body: 'Write captions for your posts in seconds, run ads that send people straight to your booking link, and ask every client to rate their visit.',
    points: ['Content Studio writes captions from your photos', 'Ads Manager for Instagram and Facebook', 'Private ratings after every completed visit'],
  },
] as const

type Key = (typeof TABS)[number]['key']

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-navy/10">{children}</div>
}

function Mock({ tab }: { tab: Key }) {
  if (tab === 'calendar') {
    const cols = [
      { name: 'Ada', items: [{ top: 8, h: 92, who: 'Femisola', what: 'Deep tissue massage', note: 'Deposit paid' }, { top: 120, h: 44, who: 'Kemi', what: 'Facial', note: '' }] },
      { name: 'Chidi', items: [{ top: 40, h: 44, who: 'Tunde', what: 'Sports massage', note: '₦25,000 at visit' }, { top: 100, h: 44, who: 'Uche', what: 'Body scrub', note: '' }] },
      { name: 'Anyone', items: [{ top: 70, h: 60, who: 'Zainab', what: 'Couples massage', note: 'Awaiting payment' }] },
    ]
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">Today</p>
            <p className="text-xs text-slate-500">Tuesday, 3 November</p>
          </div>
          <span className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white">+ Walk-in</span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {['Mon 2', 'Tue 3', 'Wed 4', 'Thu 5', 'Fri 6', 'Sat 7', 'Sun 8'].map((d, i) => (
            <div key={d} className={`rounded-xl py-1.5 ${i === 1 ? 'bg-navy text-white' : 'text-slate-700'}`}>
              <p className="text-[9px] font-semibold uppercase opacity-70">{d.split(' ')[0]}</p>
              <p className="text-sm font-bold">{d.split(' ')[1]}</p>
              <p className={`text-[8px] ${i === 6 ? 'opacity-60' : ''}`}>{i === 6 ? 'shut' : '•'.repeat([2, 3, 1, 3, 3, 3, 0][i])}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 rounded-2xl bg-slate-50 py-2.5 text-center">
          {[['7', 'bookings'], ['₦64,500', 'expected'], ['2h 30m', 'free time']].map(([v, l]) => (
            <div key={l}>
              <p className="text-sm font-bold text-slate-900">{v}</p>
              <p className="text-[10px] text-slate-500">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {cols.map((c) => (
            <div key={c.name}>
              <p className="text-center text-xs font-bold text-slate-900">{c.name}</p>
              <div className="relative mt-1.5 h-44 rounded-xl border border-slate-100 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_29px,#eef0f4_29px,#eef0f4_30px)]">
                {c.items.map((b) => (
                  <div key={b.who} className={`absolute inset-x-1 rounded-lg border-l-[3px] px-1.5 py-1 ${b.note === 'Awaiting payment' ? 'border-orange-600 bg-orange-50' : 'border-navy bg-wash'}`} style={{ top: b.top, height: b.h }}>
                    <p className="truncate text-[10px] font-bold text-slate-900">{b.who}</p>
                    <p className="truncate text-[9px] text-slate-500">{b.what}</p>
                    {b.note && b.h > 50 ? <p className={`truncate text-[8px] font-semibold ${b.note === 'Awaiting payment' ? 'text-orange-700' : 'text-slate-500'}`}>{b.note}</p> : null}
                  </div>
                ))}
                <div className="absolute inset-x-0 top-[62px] h-0.5 bg-rose-600" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }
  if (tab === 'inbox') {
    return (
      <Card>
        <p className="text-lg font-bold text-slate-900">Inbox</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">All chats</span>
          <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700">Needs you · 1</span>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {[
            ['Bisi', 'Instagram', 'How much for a couples massage on Saturday?', 'AI replied', false],
            ['Tolu', 'WhatsApp', 'I was charged twice, please help', 'Needs you', true],
            ['Ngozi', 'Messenger', 'Booked! See you at 2pm 🙏', '', false],
          ].map(([n, ch, msg, tag, alert]) => (
            <div key={n as string} className="flex items-start gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wash text-xs font-bold text-navy">{(n as string)[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{n} <span className="text-xs font-normal text-slate-400">· {ch}</span></p>
                <p className="truncate text-xs text-slate-600">{msg}</p>
              </div>
              {tag ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${alert ? 'bg-red-50 text-red-700' : 'bg-wash text-navy'}`}>{tag}</span> : null}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-2xl bg-sky p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-navy"><Sparkles className="h-3.5 w-3.5" /> Suggested reply</p>
          <p className="mt-1 text-xs text-slate-700">Hi Bisi! A couples massage is ₦55,000 for 90 minutes. We have 10:00 and 1:30pm free on Saturday. Book here: veno.app/book/serene-spa</p>
        </div>
      </Card>
    )
  }
  if (tab === 'clients') {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-slate-900">Clients</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">248</span>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {[
            ['Femisola Adeyemi', '12 visits · ₦324,000', 'Regular'],
            ['Chidi Okafor', '5 visits · ₦40,000', 'Due back'],
            ['Zainab Kareem', '1 visit · ₦9,500', 'New'],
          ].map(([n, s, tag]) => (
            <div key={n} className="flex items-center gap-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wash text-sm font-bold text-navy">{n[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{n}</p>
                <p className="text-xs text-slate-500">{s}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{tag}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-2xl border border-slate-100 p-3">
          <p className="text-[11px] font-semibold text-slate-500">Note on Femisola</p>
          <p className="mt-1 text-xs text-slate-700">Prefers Ada. Firm pressure, but go easy on the lower back. Likes the 10am slot.</p>
        </div>
      </Card>
    )
  }
  if (tab === 'money') {
    return (
      <Card>
        <p className="text-lg font-bold text-slate-900">Money</p>
        <div className="mt-3 rounded-2xl bg-navy p-4 text-white">
          <p className="text-xs text-white/70">This week</p>
          <p className="mt-1 text-2xl font-bold">₦386,000</p>
          <p className="mt-1 text-xs text-white/70">₦142,000 paid online · ₦244,000 at visit</p>
        </div>
        <div className="mt-3 flex h-24 items-end gap-2 px-1">
          {[40, 62, 35, 80, 95, 100, 20].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={`w-full rounded-md ${i === 5 ? 'bg-navy' : 'bg-wash'}`} style={{ height: `${h}%` }} />
              <span className="text-[9px] text-slate-500">{'MTWTFSS'[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100">
          {[['Deposit · Femisola', '+₦9,000'], ['Payout to your bank', '₦142,000'], ['No-shows this week', '1 (deposit kept)']].map(([l, v]) => (
            <div key={l} className="flex justify-between px-3 py-2.5 text-xs">
              <span className="text-slate-600">{l}</span>
              <span className="font-semibold text-slate-900">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    )
  }
  return (
    <Card>
      <p className="text-lg font-bold text-slate-900">Content Studio</p>
      <div className="mt-3 flex gap-3">
        <div className="h-24 w-20 shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-700 to-pink-400" />
        <div className="flex-1 rounded-xl bg-sky p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-navy"><Sparkles className="h-3.5 w-3.5" /> Caption</p>
          <p className="mt-1 text-xs text-slate-700">Sunday reset 🌿 Couples massages are back this weekend and Saturday is filling up fast. Grab a time from the link in bio.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-100 p-3">
          <BarChart3 className="h-4 w-4 text-navy" />
          <p className="mt-1.5 text-sm font-bold text-slate-900">38 bookings</p>
          <p className="text-[10px] text-slate-500">from your ad this month</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <p className="mt-1.5 text-sm font-bold text-slate-900">4.8 average</p>
          <p className="text-[10px] text-slate-500">from 56 private ratings</p>
        </div>
      </div>
    </Card>
  )
}

export function FeatureTour() {
  const [active, setActive] = useState<Key>('calendar')
  const tab = TABS.find((t) => t.key === active)!

  return (
    <div>
      <div className="-mx-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
        <div role="tablist" aria-label="What's in the app" className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
          {TABS.map((t) => {
            const on = t.key === active
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(t.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <t.Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          role="tabpanel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-10 grid items-center gap-10 lg:grid-cols-2"
        >
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{tab.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">{tab.body}</p>
            <ul className="mt-6 space-y-3">
              {tab.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash text-navy">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Mock tab={active} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
