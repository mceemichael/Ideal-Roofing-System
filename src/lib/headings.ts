/**
 * Shared with PortableBody's rendered heading `id`s — must produce
 * byte-identical slugs from the same heading text, or table-of-contents
 * links jump to a missing anchor instead of scrolling to the section.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

const HEADING_RANK: Record<string, number> = { h2: 2, h3: 3, h4: 4 }

function styleForRank(n: number): 'h2' | 'h3' | 'h4' {
  if (n <= 2) return 'h2'
  if (n === 3) return 'h3'
  return 'h4'
}

/**
 * Money pages: the article title is H1 and imported WordPress bodies still
 * jump ranks (H1 -> H3, or H2 -> H4). Walk the blocks and pull any skip back
 * to the next legal level so the outline stays sequential.
 */
export function normalizeHeadingOrder(value: unknown, floor: number): unknown {
  if (!Array.isArray(value)) return value
  let last = floor
  return value.map((b) => {
    if (b?._type !== 'block') return b
    const rank = HEADING_RANK[b.style]
    if (!rank) return b
    const next = rank > last + 1 ? last + 1 : rank
    last = next
    return next === rank ? b : { ...b, style: styleForRank(next) }
  })
}

function plainText(block: { children?: Array<{ text?: string }> }): string {
  return (block.children || []).map((c) => (typeof c.text === 'string' ? c.text : '')).join('')
}

export interface TocEntry {
  id: string
  text: string
  level: 2 | 3
  hasPriceTable: boolean
}

/**
 * Builds a table-of-contents outline from a post body: one entry per H2/H3,
 * flagging any heading whose section contains a priceTable block so the UI
 * can highlight it — that's what most visitors on these pages are looking
 * for. Pass the body through the same `fixHeadingOrder` normalization the
 * page applies before PortableBody, or the generated ids won't match the
 * rendered anchors.
 */
export function buildToc(value: unknown): TocEntry[] {
  if (!Array.isArray(value)) return []
  const entries: TocEntry[] = []
  let current: TocEntry | null = null

  for (const block of value) {
    if (block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
      const text = plainText(block).trim()
      if (!text) continue
      current = { id: slugify(text), text, level: block.style === 'h2' ? 2 : 3, hasPriceTable: false }
      entries.push(current)
    } else if (block?._type === 'priceTable' && current) {
      current.hasPriceTable = true
    }
  }

  return entries
}
