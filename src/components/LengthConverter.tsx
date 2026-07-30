'use client'

import { useState } from 'react'
import { feetToMetres, metresToFeet, formatNumber } from '@/lib/roof'

type Unit = 'feet' | 'metres'

/**
 * Feet ↔ metres converter.
 *
 * Sits above the roof calculator because most Nigerian builders measure in
 * feet while the calculator works in metres — the live page has the same
 * ordering for the same reason.
 *
 * One behavioural improvement over the WordPress version: it converts both
 * ways. The old one only went feet → metres, so anyone who had metres and
 * wanted feet had to do it by hand.
 */
export function LengthConverter() {
  const [value, setValue] = useState('')
  const [from, setFrom] = useState<Unit>('feet')

  const n = parseFloat(value)
  const valid = Number.isFinite(n) && n > 0

  const converted = valid
    ? from === 'feet'
      ? feetToMetres(n)
      : metresToFeet(n)
    : null

  const toUnit: Unit = from === 'feet' ? 'metres' : 'feet'

  return (
    <section
      aria-labelledby="length-converter-heading"
      className="my-8 overflow-hidden rounded-xl border border-surface-border bg-surface-soft"
    >
      <div className="border-b border-surface-border px-5 py-4 sm:px-6">
        <h2 id="length-converter-heading" className="text-lg font-bold text-ink">
          Length Converter
        </h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          Measuring in feet? Convert to metres first.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label
              htmlFor="converter-value"
              className="block text-sm font-medium text-ink"
            >
              Enter length
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="converter-value"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={value}
                placeholder="e.g. 40"
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-base text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <select
                aria-label="Unit to convert from"
                value={from}
                onChange={(e) => setFrom(e.target.value as Unit)}
                className="rounded-lg border border-surface-border bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="feet">Feet</option>
                <option value="metres">Metres</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFrom(toUnit)}
            aria-label={'Swap direction: convert ' + toUnit + ' to ' + from}
            title="Swap"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-white text-brand transition-colors hover:bg-brand-50 sm:flex"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M7.5 3 4 6.5l1.06 1.06L6.75 5.87V14h1.5V5.87l1.69 1.69L11 6.5 7.5 3Zm5 14 3.5-3.5-1.06-1.06-1.69 1.69V6h-1.5v8.13l-1.69-1.69L9 13.5 12.5 17Z" />
            </svg>
          </button>

          <div>
            <p className="block text-sm font-medium text-ink">
              Result in {toUnit}
            </p>
            <output
              htmlFor="converter-value"
              aria-live="polite"
              className="mt-1.5 flex h-[46px] items-center rounded-lg border border-surface-border bg-white px-3"
            >
              {converted !== null ? (
                <span className="text-lg font-bold text-brand">
                  {formatNumber(converted, 2)}
                  <span className="ml-1 text-sm font-medium text-ink-muted">
                    {toUnit === 'metres' ? 'm' : 'ft'}
                  </span>
                </span>
              ) : (
                <span className="text-sm text-ink-light">—</span>
              )}
            </output>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-light">
          1 metre = 3.2808 feet. Convert your length, width and kingpost before
          using the roof area calculator below.
        </p>
      </div>
    </section>
  )
}

export default LengthConverter
