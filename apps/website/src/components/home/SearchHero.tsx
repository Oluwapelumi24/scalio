'use client'

import { useId, useState } from 'react'
import { Calendar, MapPin, Search } from 'lucide-react'
import { AudienceSwitch } from '@/components/site/SkyHero'
import { JoinWaitlist } from '@/components/site/JoinWaitlist'
import { HeroGallery } from '@/components/home/HeroGallery'
import { CATEGORIES } from '@/lib/constants'

const FIELDS = [
  { name: 'service', label: 'All services', icon: Search },
  { name: 'where', label: 'Current location', icon: MapPin },
  { name: 'when', label: 'Any time', icon: Calendar },
] as const

type FieldName = (typeof FIELDS)[number]['name']

const SUGGESTIONS: Record<FieldName, readonly string[]> = {
  service: ['Salon', 'Barbershop', 'Spa', 'Nails', 'Laundry', 'Massage'],
  where: ['Lekki', 'Ikoyi', 'Victoria Island', 'Surulere', 'Yaba'],
  when: ['Today', 'Tomorrow', 'This weekend', 'Morning', 'Afternoon', 'Evening'],
}

const ALL_SERVICES = CATEGORIES.map((category) => category.name)

function suggestionsFor(name: FieldName, query: string) {
  const pool = name === 'service' ? ALL_SERVICES : SUGGESTIONS[name]
  const q = query.trim().toLowerCase()
  if (!q) return SUGGESTIONS[name]
  return pool.filter((item) => item.toLowerCase().includes(q))
}

/**
 * Home hero in the search-first layout: pale wash, one line of type, a
 * stacked search card, then a short proof line and an app button.
 * The Book / Get booked switch stays above the headline.
 */
export function SearchHero({ prelaunch = false }: { prelaunch?: boolean }) {
  const listId = useId()
  const [values, setValues] = useState<Record<FieldName, string>>({ service: '', where: '', when: '' })
  const [open, setOpen] = useState<FieldName | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function choose(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setOpen(null)
  }

  return (
    <section className={`relative isolate overflow-hidden bg-sky pt-40 sm:pt-48 ${prelaunch ? 'pb-16 sm:pb-20' : 'pb-28 sm:pb-36'}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_0%_0%,#ffffff_0%,rgba(255,255,255,0)_56%),radial-gradient(78%_90%_at_100%_42%,#9eb4f8_0%,rgba(63,95,217,0.28)_40%,rgba(241,245,254,0)_72%),linear-gradient(180deg,#f1f5fe_0%,#e8edfa_48%,#d7e2fb_100%)]" />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 -z-10 bg-gradient-to-b from-transparent to-white ${prelaunch ? 'h-16' : 'h-28'}`} />

      <div className="mx-auto max-w-5xl px-6 text-center">
        <AudienceSwitch active="individuals" surface="light" />

        {prelaunch ? (
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-navy">Opening soon in Lagos</p>
        ) : null}

        <h1 className={`mx-auto max-w-4xl font-display text-[2.65rem] font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-6xl lg:text-[4.25rem] ${prelaunch ? 'mt-4' : 'mt-8'}`}>
          Book local services
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-[15px] font-medium leading-relaxed text-slate-900 sm:text-[17px]">
          {prelaunch
            ? 'Spas, salons, laundry, tailors and more. Join the waitlist and be first to book when Veno opens.'
            : 'Discover spas, salons, laundromats, tailors and more across Lagos. See real free times and book in a minute.'}
        </p>

        {prelaunch ? (
          <div className="mt-10">
            <JoinWaitlist />
          </div>
        ) : null}

        {prelaunch ? null : (
        <form action="#categories" className="mx-auto mt-14 w-full max-w-[420px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-2">
            {FIELDS.map(({ name, label, icon: Icon }, index) => {
              const options = suggestionsFor(name, values[name])
              const showing = open === name
              const highlighted = Math.min(activeIndex, Math.max(options.length - 1, 0))
              return (
                <div key={name} className="relative">
                  <label className={`flex items-center gap-3 px-4 py-3.5 text-left ${index > 0 ? 'border-t border-slate-200' : ''}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0 text-slate-800" strokeWidth={1.75} aria-hidden />
                    <span className="sr-only">{label}</span>
                    <input
                      name={name}
                      type="text"
                      role="combobox"
                      aria-expanded={showing}
                      aria-controls={`${listId}-${name}`}
                      aria-autocomplete="list"
                      aria-activedescendant={showing && options[highlighted] ? `${listId}-${name}-${highlighted}` : undefined}
                      placeholder={label}
                      value={values[name]}
                      autoComplete="off"
                      onMouseDown={() => {
                        setOpen(name)
                        setActiveIndex(0)
                      }}
                      onFocus={() => {
                        setOpen(name)
                        setActiveIndex(0)
                      }}
                      onBlur={() => setOpen((current) => (current === name ? null : current))}
                      onChange={(event) => {
                        setValues((current) => ({ ...current, [name]: event.target.value }))
                        setOpen(name)
                        setActiveIndex(0)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                          event.preventDefault()
                          setOpen(name)
                          setActiveIndex((current) => Math.min(current + 1, options.length - 1))
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault()
                          setActiveIndex((current) => Math.max(current - 1, 0))
                        } else if (event.key === 'Escape') {
                          setOpen(null)
                        } else if (event.key === 'Enter' && showing && options[highlighted]) {
                          event.preventDefault()
                          choose(name, options[highlighted])
                        }
                      }}
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-800"
                    />
                  </label>
                  {showing && options.length > 0 ? (
                    <ul
                      id={`${listId}-${name}`}
                      role="listbox"
                      aria-label={`${label} suggestions`}
                      className="mx-2 mb-1 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      {options.map((option, optionIndex) => (
                        <li key={option} role="presentation">
                          <button
                            type="button"
                            role="option"
                            id={`${listId}-${name}-${optionIndex}`}
                            aria-selected={optionIndex === highlighted}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => choose(name, option)}
                            onMouseEnter={() => setActiveIndex(optionIndex)}
                            className={`block w-full px-4 py-2.5 text-left text-[15px] font-medium text-slate-900 ${optionIndex === highlighted ? 'bg-sky' : ''}`}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })}
            <button
              type="submit"
              className="mt-1 flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-[15px] font-semibold text-white transition-transform duration-150 ease-out hover:bg-black active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              Search
            </button>
          </div>
        </form>
        )}

        {prelaunch ? null : (
          <p className="mt-14 text-[15px] text-slate-950 sm:text-base">
            <span className="font-bold">Real free times.</span> Book in a minute, pay the way you like.
          </p>
        )}

      </div>
      {prelaunch ? <HeroGallery /> : null}
    </section>
  )
}
