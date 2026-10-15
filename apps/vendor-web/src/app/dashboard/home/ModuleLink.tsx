'use client'

import Link from 'next/link'
import { recordModuleUsage } from '@/app/actions/personalisation'

/** A link that also tells the ranking this module was used. */
export function ModuleLink({
  moduleId,
  href,
  className,
  children,
}: {
  moduleId: string
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={className} onClick={() => void recordModuleUsage(moduleId)}>
      {children}
    </Link>
  )
}
