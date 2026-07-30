'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * The search box that sits in your header on every page of the live site.
 *
 * Submits to /search/?q=... — a real page, so the browser back button and
 * shareable result URLs both work, unlike a dropdown-only search.
 */
export function SearchBox({
  defaultValue = '',
  autoFocus = false,
  compact = false,
}: {
  defaultValue?: string
  autoFocus?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = value.trim()
    if (!term) return
    router.push('/search/?q=' + encodeURIComponent(term))
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative flex w-full">
      <label htmlFor={compact ? 'site-search-compact' : 'site-search'} className="sr-only">
        Search this site
      </label>
      <input
        id={compact ? 'site-search-compact' : 'site-search'}
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        placeholder="Search roofing prices, guides…"
        onChange={(e) => setValue(e.target.value)}
        className={cn(
          'w-full rounded-l-lg border border-r-0 border-surface-border bg-white text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20',
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-base'
        )}
      />
      <button
        type="submit"
        className={cn(
          'shrink-0 rounded-r-lg bg-brand font-semibold text-white transition-colors hover:bg-brand-600',
          compact ? 'px-3 py-2 text-sm' : 'px-5 py-2.5 text-base'
        )}
      >
        <span className="sr-only">Search</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
          <path d="M8.5 3a5.5 5.5 0 1 0 3.36 9.85l3.64 3.65 1.42-1.42-3.65-3.64A5.5 5.5 0 0 0 8.5 3Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        </svg>
      </button>
    </form>
  )
}

export default SearchBox
