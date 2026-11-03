import { Bell, CalendarCheck, Flower2, Home, MapPin, Search, Shirt, Star, User } from 'lucide-react'
import { PhoneFrame, VendorHomeScreen } from '@/components/partners/VendorPhone'

/** The customer app's Home: greeting, search, categories and featured places. */
function CustomerHomeScreen() {
  return (
    <>
      <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-slate-900">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-2 w-3 rounded-sm bg-slate-900/70" />
          <div className="h-2 w-4 rounded-sm bg-slate-900/70" />
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin className="h-3 w-3" /> Lekki, Lagos</p>
            <p className="text-[15px] font-bold tracking-tight text-slate-900">Good evening, Tolu</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"><Bell className="h-3.5 w-3.5" /></div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-[11px] text-slate-400">
          <Search className="h-3.5 w-3.5" /> Search spa, laundry, tailors…
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ['Spa', 'from-[#065F46] to-[#10B981]'],
            ['Laundry', 'from-[#1E40AF] to-[#60A5FA]'],
            ['Tailor', 'from-[#7C2D12] to-[#F59E0B]'],
            ['Salon', 'from-[#4338CA] to-[#7C3AED]'],
          ].map(([l, g]) => (
            <div key={l}>
              <div className={`mx-auto h-11 w-11 rounded-full bg-gradient-to-br ${g}`} />
              <p className="mt-1 text-[9px] font-medium text-slate-700">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] font-bold text-slate-900">Popular near you</p>
        <div className="mt-2 space-y-2.5">
          {[
            ['from-[#065F46] to-[#34D399]', Flower2, 'Serene Spa', 'Spa · Ikoyi', '4.9', 'Free today 2:30pm'],
            ['from-[#1E40AF] to-[#93C5FD]', Shirt, 'True Wash Laundromat', 'Laundry · Yaba', '4.8', 'Pickup from 5:00pm'],
          ].map(([g, Icon, n, c, r, free]) => (
            <div key={n as string} className="overflow-hidden rounded-2xl border border-slate-100">
              <div className={`flex h-20 w-full items-center justify-center bg-gradient-to-br ${g}`}>
                <Icon className="h-8 w-8 text-white/90" strokeWidth={1.6} />
              </div>
              <div className="flex items-center justify-between p-2.5">
                <div>
                  <p className="text-[11px] font-semibold text-slate-900">{n as string}</p>
                  <p className="text-[9px] text-slate-500">{c as string}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-slate-800"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r as string}</p>
                  <p className="text-[9px] font-semibold text-emerald-700">{free as string}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-slate-100 bg-white pb-5 pt-2.5 text-slate-800">
        <Home className="h-[18px] w-[18px] text-navy" />
        <Search className="h-[18px] w-[18px]" />
        <CalendarCheck className="h-[18px] w-[18px]" />
        <User className="h-[18px] w-[18px]" />
      </div>
    </>
  )
}

/** Small glass card that floats around the phones. */
function Float({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute z-10 hidden rounded-2xl bg-white/95 p-3.5 text-left shadow-2xl shadow-navy-deep/25 ring-1 ring-black/5 backdrop-blur md:block ${className}`}>
      {children}
    </div>
  )
}

/**
 * Rises out of the home hero: the customer app in front, the business app
 * behind it, and the moments that connect them floating around.
 */
export function HomeHeroStage() {
  return (
    <div className="relative mx-auto h-[470px] max-w-4xl sm:h-[520px]">
      <div className="absolute left-1/2 top-0 z-[1] hidden -translate-x-[95%] rotate-[-7deg] scale-[0.86] opacity-90 sm:block">
        <PhoneFrame><VendorHomeScreen /></PhoneFrame>
      </div>
      <div className="absolute left-1/2 top-0 z-[2] -translate-x-1/2 sm:translate-x-[-8%]">
        <PhoneFrame><CustomerHomeScreen /></PhoneFrame>
      </div>

      <Float className="animate-float left-0 top-16 w-56">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CalendarCheck className="h-3.5 w-3.5" /></span>
          Booking confirmed
        </p>
        <p className="mt-1.5 text-xs text-slate-600">Deep tissue massage · Sat, 10:00 am</p>
      </Float>
      <Float className="animate-float-slow right-0 top-8 w-52">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Free times today</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {['2:30', '3:00', '4:30'].map((t, i) => (
            <span key={t} className={`rounded-lg py-1.5 text-center text-xs font-semibold ${i === 0 ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}>{t}</span>
          ))}
        </div>
      </Float>
      <Float className="animate-float-slow bottom-24 right-6 w-48">
        <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
        </p>
        <p className="mt-1 text-xs text-slate-600">“Shirts back pressed, on time. Booking again.”</p>
      </Float>
    </div>
  )
}
