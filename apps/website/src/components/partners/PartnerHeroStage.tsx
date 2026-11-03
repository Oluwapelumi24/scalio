import { CalendarCheck, CreditCard, MessageCircle } from 'lucide-react'
import { PhoneFrame, VendorHomeScreen } from './VendorPhone'

function Float({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute z-10 hidden rounded-2xl bg-white/95 p-3.5 text-left shadow-2xl shadow-navy-deep/25 ring-1 ring-black/5 backdrop-blur md:block ${className}`}>
      {children}
    </div>
  )
}

/** The business app rising out of the partners hero, with the day's moments around it. */
export function PartnerHeroStage() {
  return (
    <div className="relative mx-auto h-[470px] max-w-4xl sm:h-[520px]">
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <PhoneFrame><VendorHomeScreen /></PhoneFrame>
      </div>
      <Float className="animate-float left-2 top-14 w-60">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wash text-navy"><CalendarCheck className="h-3.5 w-3.5" /></span>
          New booking
        </p>
        <p className="mt-1.5 text-xs text-slate-600">Femisola booked Deep tissue massage for Sat, 10:00 am.</p>
      </Float>
      <Float className="animate-float-slow right-2 top-28 w-56">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CreditCard className="h-3.5 w-3.5" /></span>
          Deposit received
        </p>
        <p className="mt-1.5 font-display text-xl font-bold text-slate-900">₦9,000</p>
      </Float>
      <Float className="animate-float-slow bottom-24 left-10 w-56">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wash text-navy"><MessageCircle className="h-3.5 w-3.5" /></span>
          AI replied on Instagram
        </p>
        <p className="mt-1.5 text-xs text-slate-600">“A couples massage is ₦55,000. We have 10:00 free on Saturday.”</p>
      </Float>
    </div>
  )
}
