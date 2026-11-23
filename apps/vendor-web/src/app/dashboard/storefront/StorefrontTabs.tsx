'use client'

import Link from 'next/link'
import { STOREFRONT_TABS, type StorefrontTabId } from './tabs'

export function StorefrontTabs({ active }: { active: StorefrontTabId }) {
  return (
    <div
      role="tablist"
      aria-label="Business sections"
      className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto bg-[#f7f8fa] pb-1 pt-1"
    >
      {STOREFRONT_TABS.map((tab) => {
        const on = tab.id === active
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={on}
            aria-controls={`storefront-panel-${tab.id}`}
            id={`storefront-tab-${tab.id}`}
            scroll={false}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              on
                ? 'bg-[#1e3a8a] text-white'
                : 'bg-[#f5f6f8] text-[#4a4e57] hover:bg-[#e8edfa] hover:text-[#1e3a8a]'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
