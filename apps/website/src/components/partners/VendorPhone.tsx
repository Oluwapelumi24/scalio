import { Bell, Clock, CreditCard, Home, Inbox, LayoutGrid, Plus, Users, Zap } from 'lucide-react'

/** A phone frame. The screen inside is drawn from the vendor app's real layouts. */
export function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[290px] select-none ${className}`} aria-hidden>
      <div className="relative rounded-[2.6rem] border-[9px] border-slate-900 bg-slate-900 shadow-2xl shadow-navy/25">
        <div className="absolute left-1/2 top-1.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="relative h-[590px] overflow-hidden rounded-[2rem] bg-white">{children}</div>
      </div>
    </div>
  )
}

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-6 pt-3 text-[11px] font-semibold ${light ? 'text-white' : 'text-slate-900'}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className={`h-2 w-3 rounded-sm ${light ? 'bg-white/80' : 'bg-slate-900/70'}`} />
        <div className={`h-2 w-4 rounded-sm ${light ? 'bg-white/80' : 'bg-slate-900/70'}`} />
      </div>
    </div>
  )
}

/** The vendor app's tab bar: icons with small labels, and the navy + in the middle. */
export function TabBar({ active = 'Home' }: { active?: 'Home' | 'Clients' | 'Inbox' | 'More' }) {
  const tabs = [
    { label: 'Home', Icon: Home },
    { label: 'Clients', Icon: Users },
    null,
    { label: 'Inbox', Icon: Inbox },
    { label: 'More', Icon: LayoutGrid },
  ] as const
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center border-t border-slate-100 bg-white px-2 pb-5 pt-2">
      {tabs.map((t, i) =>
        t === null ? (
          <div key={i} className="flex flex-1 justify-center">
            <div className="flex h-9 w-14 items-center justify-center rounded-full bg-navy text-white">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div key={t.label} className={`flex flex-1 flex-col items-center gap-0.5 ${active === t.label ? 'text-navy' : 'text-slate-800'}`}>
            <t.Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className={`text-[8px] ${active === t.label ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
          </div>
        ),
      )}
    </div>
  )
}

/** The vendor app's Home: greeting, bell, set-up progress and what's next. */
export function VendorHomeScreen() {
  return (
    <>
      <div className="bg-navy pb-3">
        <StatusBar light />
        <div className="mt-3 flex items-center gap-2.5 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-white">Continue setup</p>
            <p className="text-[9px] text-white/75">Next: Share your booking link</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full w-3/4 rounded-full bg-white" />
            </div>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-navy">1 left</span>
        </div>
      </div>

      <div className="bg-gradient-to-b from-wash via-sky to-white px-4 pb-4 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">AO</div>
          <p className="flex-1 text-[15px] font-bold tracking-tight text-slate-900">Hey, Ada</p>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white">
            <Bell className="h-4 w-4 text-slate-900" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[8px] font-bold text-white">
              3
            </span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-600">4 bookings today. Next one in 20 minutes.</p>
      </div>

      <div className="space-y-4 px-4">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-slate-900">Up next</p>
            <p className="text-[10px] font-semibold text-navy">Calendar</p>
          </div>
          <div className="mt-2 space-y-2">
            {[
              { time: '10:00', name: 'Femisola A.', what: 'Deep tissue massage · 90m', tag: 'Deposit paid', tone: 'text-slate-500' },
              { time: '11:30', name: 'Chidi O.', what: 'Hot stone therapy', tag: '₦25,000 at visit', tone: 'text-slate-500' },
              { time: '1:00', name: 'Zainab K.', what: 'Signature facial', tag: 'Awaiting payment', tone: 'text-orange-700' },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
                <div className="w-9 text-center">
                  <p className="text-[11px] font-bold tabular-nums text-slate-900">{b.time}</p>
                </div>
                <div className="h-8 w-[3px] rounded-full bg-navy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-900">{b.name}</p>
                  <p className="truncate text-[9px] text-slate-500">{b.what}</p>
                </div>
                <span className={`text-[8px] font-semibold ${b.tone}`}>{b.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <Clock className="h-3.5 w-3.5 text-navy" />
            <p className="mt-1.5 text-[13px] font-bold text-slate-900">2h 30m</p>
            <p className="text-[9px] text-slate-500">free today</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <CreditCard className="h-3.5 w-3.5 text-navy" />
            <p className="mt-1.5 text-[13px] font-bold text-slate-900">₦142,000</p>
            <p className="text-[9px] text-slate-500">expected today</p>
          </div>
        </div>
      </div>

      <TabBar />
    </>
  )
}
