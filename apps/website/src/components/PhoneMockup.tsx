import { Search, MapPin, Star } from 'lucide-react'

const CHIPS = ['Salon', 'Spa', 'Barbershop', 'Nails', 'Makeup']

const FEATURED = [
  { name: 'Glow Beauty Studio', category: 'Salon · Lekki', rating: '4.9' },
  { name: 'Onyx Barbers', category: 'Barbershop · Ikeja', rating: '4.8' },
]

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] select-none">
      <div className="relative rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl shadow-indigo-950/30">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
        <div className="relative h-[560px] overflow-hidden rounded-[2rem] bg-white">
          <div className="flex items-center justify-between px-5 pt-8 pb-1 text-[11px] font-medium text-slate-900">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-3 rounded-sm bg-slate-900/70" />
              <div className="h-2 w-4 rounded-sm bg-slate-900/70" />
            </div>
          </div>

          <div className="px-5 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
              Lekki, Lagos
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Find your next service</h3>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Search salons, spas…</span>
            </div>

            <div className="mt-4 flex gap-2 overflow-hidden">
              {CHIPS.map((chip, i) => (
                <span
                  key={chip}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Featured</span>
              <span className="text-xs font-medium text-indigo-600">See all</span>
            </div>

            <div className="mt-3 space-y-3">
              {FEATURED.map((v) => (
                <div key={v.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm shadow-slate-200/50">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.category}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-medium text-slate-700">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {v.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
