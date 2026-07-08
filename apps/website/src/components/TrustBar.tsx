import { ShieldCheck, Zap, CreditCard, Bell } from 'lucide-react'

const ITEMS = [
  { icon: Zap, label: 'Real-time availability' },
  { icon: CreditCard, label: 'Secure payments via Paystack' },
  { icon: Bell, label: 'Automated booking reminders' },
  { icon: ShieldCheck, label: 'Every vendor manually reviewed' },
]

export function TrustBar() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-slate-600">
            <item.icon className="h-4 w-4 shrink-0 text-indigo-600" strokeWidth={2.25} />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
