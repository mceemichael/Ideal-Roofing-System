/**
 * Roof geometry.
 *
 * Kept separate from the UI so the maths can be unit tested, and so there is
 * exactly one place to change the formula if you decide the estimate should
 * behave differently.
 *
 * ---------------------------------------------------------------------------
 * THE FORMULA — verified 2026-07-29 against the live page's actual inline
 * script (view-source, not inference). It is NOT true roof trigonometry —
 * it's a simple linear approximation — but it's the exact formula the live
 * calculator has been running, so it's what stays, because it's the number
 * customers have already been quoting back to Michael for years:
 *
 *   base area          = L × W
 *   "triangular" area  = 2 × (½ × W × H)   =  W × H
 *   roof area          = L × W + W × H     =  W × (L + H)
 *
 * For L=12, W=9, H=2.5 this gives 108 + 22.5 = 130.50 m². (An earlier draft
 * of this file used a real Pythagorean slope-area formula — sqrt((W/2)²+H²)
 * — which is geometrically more correct but gives 123.55 m² for the same
 * inputs. That was an inference made without the live source and it does not
 * match. Matching the live number wins: see HANDOFF.md §6 item 5 and the
 * project rule "when choosing between technically better and matching
 * existing behaviour, match existing behaviour.")
 *
 * `rafterLength`, `slopeFactor` and `pitchDegrees` below are real Pythagorean
 * geometry, kept as separate informational stats for anyone who wants them —
 * the live tool never showed them, and they are NOT what the headline
 * `areaSqm` number is derived from any more.
 * ---------------------------------------------------------------------------
 */

export const FEET_PER_METRE = 3.280839895

export function feetToMetres(feet: number): number {
  return feet / FEET_PER_METRE
}

export function metresToFeet(metres: number): number {
  return metres * FEET_PER_METRE
}

export type RoofResult = {
  /** Roof surface area in square metres. */
  areaSqm: number
  /** Length of one rafter, wall plate to ridge, in metres. */
  rafterLength: number
  /** How much bigger the roof surface is than the building footprint. */
  slopeFactor: number
  /** Roof pitch in degrees. */
  pitchDegrees: number
  /** Footprint of the building in square metres. */
  footprintSqm: number
}

/**
 * Returns null rather than NaN for invalid input. Callers should treat null as
 * "not enough information yet" and show nothing, rather than rendering a
 * confident-looking wrong number.
 */
export function calculateRoofArea(
  lengthM: number,
  widthM: number,
  kingpostM: number
): RoofResult | null {
  if (
    !Number.isFinite(lengthM) ||
    !Number.isFinite(widthM) ||
    !Number.isFinite(kingpostM) ||
    lengthM <= 0 ||
    widthM <= 0 ||
    kingpostM <= 0
  ) {
    return null
  }

  const halfWidth = widthM / 2
  const rafterLength = Math.sqrt(halfWidth * halfWidth + kingpostM * kingpostM)
  const slopeFactor = rafterLength / halfWidth
  const footprintSqm = lengthM * widthM
  // Matches the live calculator's actual formula exactly (see block comment above).
  const areaSqm = footprintSqm + widthM * kingpostM
  const pitchDegrees = (Math.atan(kingpostM / halfWidth) * 180) / Math.PI

  return { areaSqm, rafterLength, slopeFactor, pitchDegrees, footprintSqm }
}

/**
 * Wastage allowance. Real installations lose material to cutting at hips,
 * valleys and ridges, plus overlap. 10% is the conventional allowance for a
 * simple roof; complex shapes run higher.
 *
 * Shown as a separate figure rather than baked into the headline number,
 * because the headline number is what the old calculator returned and people
 * compare quotes against it.
 */
export const WASTAGE_RATE = 0.1

export function withWastage(areaSqm: number, rate = WASTAGE_RATE): number {
  return areaSqm * (1 + rate)
}

export function round(value: number, dp = 2): number {
  const f = Math.pow(10, dp)
  return Math.round(value * f) / f
}

/** Formats a number the way Nigerian readers expect: 1,234.56 */
export function formatNumber(value: number, dp = 2): string {
  return round(value, dp).toLocaleString('en-NG', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })
}
