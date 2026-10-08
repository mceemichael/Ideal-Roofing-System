'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { whatsappHref } from '@/lib/whatsapp'
import type { Design } from '@/lib/designs'

/**
 * Stone-coated designs as a product grid: one card per design, and tapping a
 * colour swatch swaps the photo, the colour name and the prices for that
 * colour. Replaces the one-photo-at-a-time carousel on that pricelist — same
 * photos, same alt text, all designs visible at once.
 */

const SWATCH_CLASSES: Record<string, string> = {
  black: 'bg-[#1c1c1c]',
  wine: 'bg-[#7a2e3a]',
  coffee: 'bg-[#6f4e37]',
  white: 'bg-[#d9d9d9]',
}
const SWATCH_FALLBACK = 'bg-[#6b7280]'

function stockClass(stock: string): string {
  return /limited/i.test(stock) ? 'text-amber-700' : 'text-emerald-700'
}

function DesignCard({ design }: { design: Design }) {
  const [index, setIndex] = useState(0)
  const colour = design.colours[index]

  return (
    // `relative` keeps the sr-only label inside the phone swipe row; without
    // it the label escapes the row and makes the whole page scroll sideways.
    <article className="relative flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-surface-border bg-white shadow-card sm:w-auto">
      <Image
        src={colour.src}
        alt={colour.alt}
        width={800}
        height={671}
        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 270px"
        className="aspect-[940/788] w-full object-cover"
      />

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-base font-bold leading-snug text-ink">{design.name}</h3>
        <p className="mt-1 text-sm text-ink-muted" aria-live="polite">
          {colour.prices.length ? (
            <>
              From {colour.prices[0].price} <span aria-hidden="true">·</span>{' '}
            </>
          ) : null}
          {colour.name}
        </p>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={design.name + ' colours'}>
          {design.colours.map((c, i) => (
            <button
              key={c.name}
              type="button"
              aria-label={c.name}
              aria-pressed={i === index}
              title={c.name}
              onClick={() => setIndex(i)}
              className="flex flex-col items-center gap-1"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative block h-7 w-7 overflow-hidden rounded-sm border border-black/20',
                  SWATCH_CLASSES[c.swatch[0]] || SWATCH_FALLBACK
                )}
              >
                {c.swatch[1] ? (
                  <span
                    className={cn('absolute inset-y-0 right-0 w-1/2', SWATCH_CLASSES[c.swatch[1]])}
                  />
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={cn('h-0.5 w-7', i === index ? 'bg-ink' : 'bg-transparent')}
              />
            </button>
          ))}
        </div>

        {colour.prices.length ? (
          <ul className="mt-3 flex-1 space-y-1 border-t border-surface-border pt-3 text-sm text-ink">
            {colour.prices.map((p) => (
              <li key={p.thickness} className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span>
                  {p.thickness} <span className="font-semibold">{p.price}</span>
                </span>
                <span className={cn('text-xs font-medium', stockClass(p.stock))}>{p.stock}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex-1 border-t border-surface-border pt-3 text-sm text-ink-muted">
            Message us for the current price.
          </p>
        )}

        <a
          href={whatsappHref(
            'Hi, what is the discounted price for ' +
              design.name +
              ' (' +
              colour.name +
              ') stone coated roofing sheets?'
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 rounded-lg bg-secondary px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand"
        >
          Order on WhatsApp
          <span className="sr-only">
            {' '}
            — {design.name}, {colour.name}
          </span>
        </a>
      </div>
    </article>
  )
}

export function DesignGrid({ designs }: { designs: Design[] }) {
  if (!designs.length) return null

  return (
    // Breaks out of the 760px article column to the full content width.
    <section className="relative left-1/2 my-10 w-[min(calc(100vw-2rem),1092px)] -translate-x-1/2">
      <h2 className="text-2xl font-bold leading-snug text-white sm:text-[1.75rem]">
        Stone-coated designs and colours
      </h2>
      <p className="mt-2 text-white/85">
        Tap a colour under any design to see it. Prices are per square metre.
        <span className="sm:hidden"> Swipe sideways for more designs.</span>
      </p>
      {/* Phones: one swipeable row, next card peeking in. sm and up: a grid. */}
      <div className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {designs.map((design) => (
          <DesignCard key={design.name} design={design} />
        ))}
      </div>
    </section>
  )
}

export default DesignGrid
