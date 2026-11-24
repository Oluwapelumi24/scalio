'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

export type SelectOption = { value: string; label: string }

const TRIGGER = 'w-full rounded-2xl border border-[#e4e6eb] bg-white px-4 py-3 text-sm text-gray-900'

/** Form menu that opens in our own panel, instead of the operating system's list. */
export function SelectMenu({
  id,
  name,
  options,
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Choose',
  required = false,
  disabled = false,
  className = TRIGGER,
  'aria-label': ariaLabel,
}: {
  id?: string
  name?: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const [inner, setInner] = useState(defaultValue)
  const current = value ?? inner
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [box, setBox] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const searchable = options.length > 12
  const selected = options.find((option) => option.value === current)
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }, [options, query])

  function place() {
    const node = buttonRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow
    const width = Math.max(rect.width, 220)
    setBox({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.max(160, Math.min(320, (openUp ? spaceAbove : spaceBelow) - 16)),
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
    })
  }

  useEffect(() => {
    if (!open) return
    place()
    const onScroll = () => place()
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!searchable) menuRef.current?.focus()
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open, searchable])

  function choose(next: string) {
    setInner(next)
    onChange?.(next)
    setOpen(false)
    setQuery('')
    buttonRef.current?.focus()
  }

  function onButtonKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, Math.max(shown.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && shown[active]) {
      event.preventDefault()
      choose(shown[active].value)
    }
  }

  const menu = open && box
    ? createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={onMenuKey}
          style={{ position: 'fixed', left: box.left, width: box.width, top: box.top, bottom: box.bottom, zIndex: 80 }}
          className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)] outline-none"
        >
          {searchable ? (
            <div className="border-b border-[#eef0f4] p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                placeholder="Search"
                className="h-10 w-full rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#1e3a8a] focus:bg-white"
              />
            </div>
          ) : null}
          <div className="overflow-y-auto p-1.5" style={{ maxHeight: box.maxHeight }}>
            {shown.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-500">Nothing matches.</p>
            ) : (
              shown.map((option, index) => {
                const isSelected = option.value === current
                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`keep-height select-option flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${
                      isSelected ? 'bg-[#e8edfa] font-semibold text-[#1e3a8a]' : index === active ? 'bg-[#f4f6fb] text-gray-900' : 'text-gray-900'
                    }`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check /> : null}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div ref={rootRef} className="relative">
      {name ? (
        <input
          tabIndex={-1}
          aria-hidden
          name={name}
          value={current}
          required={required}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault()
            setOpen(true)
            buttonRef.current?.focus()
          }}
          className="sr-only"
        />
      ) : null}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => {
          setQuery('')
          setOpen((was) => !was)
        }}
        onKeyDown={onButtonKey}
        className={`keep-height select-trigger flex w-full items-center justify-between gap-3 text-left text-gray-900 disabled:opacity-60 ${className}`}
      >
        <span className={selected ? 'truncate text-gray-900' : 'truncate text-gray-400'}>{selected?.label ?? placeholder}</span>
        <Chevron open={open} />
      </button>
      {menu}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 text-[#1e3a8a]">
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
