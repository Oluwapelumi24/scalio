'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

export function AccountMenu({
  name,
  email,
  logout,
}: {
  name: string
  email: string
  logout: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const pathname = usePathname()
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'V'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="flex h-10 max-w-[16rem] items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`${name}, Operations Manager`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-semibold leading-4 text-gray-900">{name}</span>
          <span className="block truncate text-[11px] leading-4 text-gray-500">Operations Manager</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
          </div>
          <Link
            href="/dashboard/team"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Team
          </Link>
          <div className="my-1.5 border-t border-gray-100" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
