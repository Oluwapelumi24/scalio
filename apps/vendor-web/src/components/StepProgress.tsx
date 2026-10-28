'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Progress bar across the top of a multi-step flow: a gradient fill that eases
 * to each step with a moving sheen, a percentage that counts along, and a dot
 * per step that pops a tick when done. Finished steps are clickable.
 */
export function StepProgress({ steps, current, onStepClick }: { steps: string[]; current: number; onStepClick?: (i: number) => void }) {
  const target = steps.length <= 1 ? 100 : Math.round(((current + 1) / steps.length) * 100)
  const [shown, setShown] = useState(target)
  const from = useRef(target)

  // Count the percentage towards the new value over the same time the bar takes.
  useEffect(() => {
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 600)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(Math.round(begin + (target - begin) * eased))
      if (k < 1) frame = requestAnimationFrame(tick)
      else from.current = target
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1} aria-valuetext={`Step ${current + 1} of ${steps.length}: ${steps[current]}`} className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Step {current + 1} of {steps.length}</p>
          <p className="text-lg font-semibold text-gray-900">{steps[current]}</p>
        </div>
        <span className="text-sm font-medium tabular-nums text-indigo-700">{shown}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-indigo-50">
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-800 via-indigo-500 to-teal-500 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${target}%` }}
        >
          <span className="step-sheen absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/0 via-white/60 to-white/0" />
        </div>
      </div>

      <ol className="flex">
        {steps.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo'
          const clickable = state === 'done' && !!onStepClick
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(i)}
                aria-label={clickable ? `Back to ${label}` : label}
                className={`relative flex h-5 w-5 items-center justify-center rounded-full ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {state === 'current' && <span className="step-breathe absolute inset-0 rounded-full bg-indigo-600" />}
                {state === 'done' && (
                  <span key="done" className="step-pop flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3.5 8.5l3 3 6-7" /></svg>
                  </span>
                )}
                {state === 'current' && <span key="cur" className="step-pop relative h-5 w-5 rounded-full border-4 border-indigo-100 bg-indigo-700" />}
                {state === 'todo' && <span className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />}
              </button>
              <span className={`truncate text-[11px] ${state === 'current' ? 'font-medium text-indigo-700' : state === 'done' ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
