'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { site } from '@/lib/site'
import {
  calculateRoofArea,
  formatNumber,
  withWastage,
  WASTAGE_RATE,
} from '@/lib/roof'

/**
 * Replaces the WordPress roof area calculator.
 *
 * Differences from the old one, all deliberate:
 *
 * - Results update as you type. The old version needed a button press, which
 *   meant people who mistyped a digit had to press it again to notice.
 * - Uses <output> and aria-live so screen readers announce the result.
 * - inputMode="decimal" brings up the numeric keypad on phones. Most of your
 *   traffic is mobile and this is the difference between a usable tool and an
 *   abandoned one.
 * - Shows the wastage allowance as a separate figure. The headline number
 *   still matches the old calculator, because that is the number people have
 *   been quoting back to you.
 */
export function RoofAreaCalculator() {
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [kingpost, setKingpost] = useState('')

  const result = useMemo(
    () => calculateRoofArea(parseFloat(length), parseFloat(width), parseFloat(kingpost)),
    [length, width, kingpost]
  )

  const anyInput = length !== '' || width !== '' || kingpost !== ''
  const allFilled = length !== '' && width !== '' && kingpost !== ''

  function reset() {
    setLength('')
    setWidth('')
    setKingpost('')
  }

  return (
    <section
      aria-labelledby="roof-calc-heading"
      className="my-8 overflow-hidden rounded-xl border border-surface-border bg-white shadow-card"
    >
      <div className="bg-brand px-5 py-4 text-white sm:px-6">
        <h2 id="roof-calc-heading" className="text-lg font-bold sm:text-xl">
          Roof Area Calculator
        </h2>
        <p className="mt-0.5 text-sm text-white/85">
          Using house length, width and kingpost
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="roof-length"
            label="House Length"
            unit="metres"
            value={length}
            onChange={setLength}
            placeholder="e.g. 12"
          />
          <Field
            id="roof-width"
            label="House Width"
            unit="metres"
            value={width}
            onChange={setWidth}
            placeholder="e.g. 9"
          />
          <Field
            id="roof-kingpost"
            label="Kingpost"
            unit="metres"
            value={kingpost}
            onChange={setKingpost}
            placeholder="e.g. 2.5"
            hint="Flat roof? Enter 1"
          />
        </div>

        {/* Result */}
        <output
          htmlFor="roof-length roof-width roof-kingpost"
          aria-live="polite"
          className="mt-6 block"
        >
          {result ? (
            <div className="rounded-lg bg-brand-50 p-5">
              <p className="text-sm font-medium text-brand-700">
                Estimated roof area
              </p>
              <p className="mt-1 text-4xl font-bold leading-none text-brand">
                {formatNumber(result.areaSqm)}
                <span className="ml-1.5 text-xl font-semibold">m²</span>
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-brand-200 pt-4 text-sm sm:grid-cols-4">
                <Stat
                  label={'With ' + Math.round(WASTAGE_RATE * 100) + '% wastage'}
                  value={formatNumber(withWastage(result.areaSqm)) + ' m²'}
                  emphasis
                />
                <Stat label="Roof pitch" value={formatNumber(result.pitchDegrees, 1) + '°'} />
                <Stat label="Rafter length" value={formatNumber(result.rafterLength) + ' m'} />
                <Stat
                  label="Building footprint"
                  value={formatNumber(result.footprintSqm) + ' m²'}
                />
              </dl>

              <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                Order the wastage figure, not the bare area. Cutting at hips,
                valleys and ridges plus sheet overlap consumes roughly{' '}
                {Math.round(WASTAGE_RATE * 100)}% more material than the raw
                surface area on a simple roof — more on a complex one.
              </p>
            </div>
          ) : anyInput ? (
            <div className="rounded-lg border border-dashed border-surface-border p-5 text-center text-sm text-ink-light">
              {allFilled
                ? 'Please enter positive numbers in all three fields.'
                : 'Fill in all three measurements to see your estimate.'}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-surface-border p-5 text-center text-sm text-ink-light">
              Enter your measurements above and the estimate appears here.
            </div>
          )}
        </output>

        {anyInput ? (
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-medium text-brand hover:underline"
          >
            Clear
          </button>
        ) : null}

        {/* Caveats — reproduced from the live page, which is right to carry them */}
        <div className="mt-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-ink">This is an estimate</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            The figure may vary slightly once woodwork is complete and physical
            measurements are taken. This method works well for{' '}
            <Link
              href="/popular-nigerian-roof-styles/"
              className="font-medium text-cta no-underline"
            >
              hip, gable and shed roofs
            </Link>
            , but not for complex or multi-level roof structures. For those,
            send us your roof plan and we will work it out properly.
          </p>
        </div>

        {/* Next steps */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={site.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Send us your measurements
          </a>
          <Link
            href="/pricelist/"
            className="rounded-lg border border-brand px-5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            See current prices
          </Link>
        </div>
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  unit,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label} <span className="font-normal text-ink-light">({unit})</span>
      </label>
      <input
        id={id}
        type="number"
        // Brings up the decimal keypad on phones rather than the full keyboard.
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-surface-border px-3 py-2.5 text-base text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {hint ? <p className="mt-1 text-xs text-ink-light">{hint}</p> : null}
    </div>
  )
}

function Stat({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? 'mt-0.5 text-base font-bold text-brand'
            : 'mt-0.5 text-base font-semibold text-ink'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export default RoofAreaCalculator
