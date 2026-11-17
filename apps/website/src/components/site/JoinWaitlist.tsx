import type { ReactNode } from 'react'

/** The only signup action on the pre-launch site. Label stays identical everywhere. */
export const WAITLIST_CTA = 'Join the waitlist'
export const WAITLIST_HREF = '#waitlist'

const PILL =
  'inline-flex h-12 items-center justify-center rounded-[20px] bg-navy px-6 text-[15px] font-semibold text-white transition-transform duration-150 ease-out hover:bg-navy-deep active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:transition-none motion-reduce:active:scale-100'

export function JoinWaitlist({
  href = WAITLIST_HREF,
  className = '',
  children,
}: {
  href?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <a href={href} className={`${PILL} ${className}`}>
      {children ?? WAITLIST_CTA}
    </a>
  )
}
