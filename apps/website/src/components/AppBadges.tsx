import { Apple, PlayCircle } from 'lucide-react'

export function AppBadges({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const dark = variant === 'dark'
  return (
    <div className="flex flex-wrap items-center gap-3">
      {[
        { icon: Apple, store: 'App Store' },
        { icon: PlayCircle, store: 'Google Play' },
      ].map(({ icon: Icon, store }) => (
        <div
          key={store}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${
            dark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-white'
          }`}
        >
          <Icon className={`h-6 w-6 ${dark ? 'text-white' : 'text-slate-900'}`} />
          <div className="leading-tight">
            <p className={`text-[10px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>Coming soon on</p>
            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{store}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
