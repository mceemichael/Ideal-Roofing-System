/**
 * Dates are rendered dd/mm/yyyy to match the live WordPress site. Changing the
 * format would be a visible content change on every post for no benefit.
 */
export function formatDate(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return dd + '/' + mm + '/' + yyyy
}

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "21 August 2026" from a YYYY-MM-DD date field — no timezone shift. */
export function formatLongDate(value?: string | null): string {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return formatDate(value)
  const month = MONTHS_LONG[Number(m[2]) - 1]
  if (!month) return formatDate(value)
  return Number(m[3]) + ' ' + month + ' ' + m[1]
}

/**
 * "August 2026" — the visitor's current month/year, computed at render time.
 * Used for nav labels like "...Roofing Sheet | August 2026" so they're
 * always correct without a monthly manual edit or redeploy.
 */
export function currentMonthYear(): string {
  return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

/** ISO 8601 for datetime attributes and structured data. */
export function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, clean.lastIndexOf(' ', max)) + '…'
}

/** Pull the video ID out of any YouTube URL shape. */
export function youtubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}
