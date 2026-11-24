'use client'

import { useEffect } from 'react'

/** The page scrolls inside the main column, so a hash does not land on its own. */
function reveal() {
  const id = window.location.hash.replace(/^#/, '')
  if (!id) return
  const el = document.getElementById(id)
  const main = el?.closest('main')
  if (!el || !(main instanceof HTMLElement)) return
  const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop
  main.scrollTo({ top: Math.max(0, top - 24) })
}

export function ScrollToRequest() {
  useEffect(() => {
    const first = requestAnimationFrame(() => {
      reveal()
      requestAnimationFrame(reveal)
    })
    window.addEventListener('hashchange', reveal)
    return () => {
      cancelAnimationFrame(first)
      window.removeEventListener('hashchange', reveal)
    }
  }, [])
  return null
}
