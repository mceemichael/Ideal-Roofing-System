/**
 * A Rank Math-style on-page SEO checklist, computed client-side in the
 * Studio from whatever is currently typed — no save required.
 *
 * This is deliberately a plain, framework-free function (no React, no
 * Sanity Studio imports) so it can be unit-reasoned-about on its own and
 * reused by the character-count inputs, the per-document "SEO Analysis"
 * view, and the site-wide "SEO Overview" tool without any of them needing
 * to agree on anything except this one shape.
 */

export type SeoCheck = {
  id: string
  label: string
  passed: boolean
  /** Shown under the label to explain the pass/fail, e.g. an actual count. */
  detail?: string
}

export type SeoScoreResult = {
  score: number // 0-100
  checks: SeoCheck[]
  titleLength: number
  descriptionLength: number
  wordCount: number
}

// Rank Math's own thresholds — Michael already knows these numbers.
export const TITLE_MIN = 30
export const TITLE_MAX = 60
export const DESCRIPTION_MIN = 120
export const DESCRIPTION_MAX = 160
const MIN_WORD_COUNT = 300
const IDEAL_WORD_COUNT = 600

type PortableBlock = {
  _type?: string
  style?: string
  children?: Array<{ text?: string }>
  alt?: string
  asset?: unknown
  legacyUrl?: string
  slides?: Array<{ alt?: string }>
}

type ScorableDoc = {
  title?: string
  slug?: { current?: string }
  body?: PortableBlock[]
  seo?: {
    title?: string
    description?: string
    focusKeyword?: string
  }
}

function blockText(block: PortableBlock): string {
  if (block._type !== 'block' || !block.children) return ''
  return block.children.map((c) => c.text || '').join('')
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

/** True if every significant word in the keyword phrase appears in the haystack. */
function containsKeyword(haystack: string, keyword: string): boolean {
  const words = normalize(keyword)
    .split(/\s+/)
    .filter((w) => w.length > 1)
  if (!words.length) return false
  const hay = normalize(haystack)
  return words.every((w) => hay.includes(w))
}

function wordCount(body: PortableBlock[]): number {
  const text = body
    .map(blockText)
    .join(' ')
    .trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function firstParagraph(body: PortableBlock[]): string {
  const first = body.find((b) => b._type === 'block' && (b.style === 'normal' || !b.style))
  return first ? blockText(first) : ''
}

function headingsText(body: PortableBlock[]): string {
  return body
    .filter((b) => b._type === 'block' && (b.style === 'h2' || b.style === 'h3' || b.style === 'h4'))
    .map(blockText)
    .join(' ')
}

function hasImageWithAlt(body: PortableBlock[]): boolean {
  return body.some((b) => {
    if (b._type === 'legacyImage' && (b.asset || b.legacyUrl) && b.alt?.trim()) return true
    if (b._type === 'imageCarousel' && b.slides?.some((s) => s.alt?.trim())) return true
    return false
  })
}

export function computeSeoScore(doc: ScorableDoc): SeoScoreResult {
  const title = doc.seo?.title || doc.title || ''
  const description = doc.seo?.description || ''
  const focusKeyword = doc.seo?.focusKeyword?.trim() || ''
  const slug = doc.slug?.current || ''
  const body = Array.isArray(doc.body) ? doc.body : []
  const words = wordCount(body)

  const checks: SeoCheck[] = [
    {
      id: 'titleLength',
      label: 'SEO title is ' + TITLE_MIN + '-' + TITLE_MAX + ' characters',
      passed: title.length >= TITLE_MIN && title.length <= TITLE_MAX,
      detail: title.length + ' characters',
    },
    {
      id: 'descriptionLength',
      label: 'Meta description is ' + DESCRIPTION_MIN + '-' + DESCRIPTION_MAX + ' characters',
      passed: description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX,
      detail: description.length + ' characters',
    },
    {
      id: 'hasFocusKeyword',
      label: 'A focus keyword is set',
      passed: focusKeyword.length > 0,
    },
    {
      id: 'keywordInTitle',
      label: 'Focus keyword appears in the SEO title',
      passed: focusKeyword.length > 0 && containsKeyword(title, focusKeyword),
    },
    {
      id: 'keywordInDescription',
      label: 'Focus keyword appears in the meta description',
      passed: focusKeyword.length > 0 && containsKeyword(description, focusKeyword),
    },
    {
      id: 'keywordInSlug',
      label: 'Focus keyword appears in the URL',
      passed: focusKeyword.length > 0 && containsKeyword(slug.replace(/-/g, ' '), focusKeyword),
    },
    {
      id: 'keywordInIntro',
      label: 'Focus keyword appears in the first paragraph',
      passed: focusKeyword.length > 0 && containsKeyword(firstParagraph(body), focusKeyword),
    },
    {
      id: 'keywordInHeading',
      label: 'Focus keyword appears in a subheading',
      passed: focusKeyword.length > 0 && containsKeyword(headingsText(body), focusKeyword),
    },
    {
      id: 'contentLength',
      label: 'Content is at least ' + MIN_WORD_COUNT + ' words (' + IDEAL_WORD_COUNT + '+ is ideal)',
      passed: words >= MIN_WORD_COUNT,
      detail: words + ' words',
    },
    {
      id: 'imageAlt',
      label: 'At least one image has alt text filled in',
      passed: hasImageWithAlt(body),
    },
  ]

  const passedCount = checks.filter((c) => c.passed).length
  const score = Math.round((passedCount / checks.length) * 100)

  return {
    score,
    checks,
    titleLength: title.length,
    descriptionLength: description.length,
    wordCount: words,
  }
}

/** For DocumentBadgeDescription.color, which uses this exact vocabulary. */
export function scoreColor(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}

/** For @sanity/ui's Card/Badge `tone` prop, which uses a different vocabulary. */
export function scoreTone(score: number): 'positive' | 'caution' | 'critical' {
  if (score >= 80) return 'positive'
  if (score >= 50) return 'caution'
  return 'critical'
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Good'
  if (score >= 50) return 'OK'
  return 'Needs work'
}
