import type { ReactNode } from 'react'

/** Centered empty-state block with illustration, copy, and actions. */
export function EmptyState({
  art,
  title,
  body,
  action,
}: {
  art: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-[#e4e6eb] bg-white px-6 py-12 text-center">
      {art}
      <p className="mt-4 text-sm font-semibold text-[#0a0a0a]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#4a4e57]">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
