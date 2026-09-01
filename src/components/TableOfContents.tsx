import { buildToc, normalizeHeadingOrder } from '@/lib/headings'
import { cn } from '@/lib/cn'

/**
 * Auto-generated from the post's own H2/H3 headings, so it can never drift
 * out of sync with the anchors PortableBody renders. Sections that contain a
 * price table are highlighted with the same white-pill treatment the price
 * tables themselves use (see PortableBody's priceTable renderer) — that's
 * what most visitors on these pages are actually looking for.
 *
 * `pricelistOnly` (aluminium and Gerard — see PRICELIST_ONLY_TOC_SLUGS in
 * @/lib/site) strips every entry except the price-table sections themselves,
 * so the whole box becomes a one- or two-link jump straight to pricing. Text
 * is bold cta-red on white — `text-cta` is the palette's own light-surface
 * red (see tailwind.config.ts), so this is a safe, already-established
 * combo, not a one-off contrast guess.
 */
export function TableOfContents({
  body,
  fixHeadingOrder = false,
  pricelistOnly = false,
}: {
  body: unknown
  fixHeadingOrder?: boolean
  pricelistOnly?: boolean
}) {
  const blocks = fixHeadingOrder ? normalizeHeadingOrder(body, 1) : body
  const allEntries = buildToc(blocks)
  const entries = pricelistOnly ? allEntries.filter((e) => e.hasPriceTable) : allEntries
  if (pricelistOnly ? entries.length < 1 : entries.length < 2) return null

  if (pricelistOnly) {
    return (
      <nav aria-label="Table of contents" className="my-8 rounded-lg bg-white p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Price list
        </p>
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <a
                href={'#' + entry.id}
                className="font-bold text-cta no-underline transition-opacity hover:opacity-80"
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  return (
    <nav
      aria-label="Table of contents"
      className="my-8 rounded-lg border border-white/20 bg-white/5 p-5"
    >
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
        On this page
      </p>
      <ol className="space-y-2 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? 'ml-5' : undefined}>
            <a
              href={'#' + entry.id}
              className={cn(
                'inline-flex items-center gap-2 no-underline transition-opacity hover:opacity-80',
                entry.hasPriceTable
                  ? 'rounded-full bg-white px-3 py-1 font-semibold text-ink'
                  : 'text-white/85 hover:text-white'
              )}
            >
              {entry.text}
              {entry.hasPriceTable ? (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                  Price list
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default TableOfContents
