import { buildToc, normalizeHeadingOrder } from '@/lib/headings'
import { cn } from '@/lib/cn'

/**
 * Auto-generated from the post's own H2/H3 headings, so it can never drift
 * out of sync with the anchors PortableBody renders. Sections that contain a
 * price table are highlighted with the same white-pill treatment the price
 * tables themselves use (see PortableBody's priceTable renderer) — that's
 * what most visitors on these pages are actually looking for.
 */
export function TableOfContents({
  body,
  fixHeadingOrder = false,
}: {
  body: unknown
  fixHeadingOrder?: boolean
}) {
  const blocks = fixHeadingOrder ? normalizeHeadingOrder(body, 1) : body
  const entries = buildToc(blocks)
  if (entries.length < 2) return null

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
