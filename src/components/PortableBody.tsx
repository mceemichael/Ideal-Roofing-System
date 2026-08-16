import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { imageSrc } from '../../sanity/image'
import { youtubeId } from '@/lib/format'
import { cn } from '@/lib/cn'
import RoofAreaCalculator from './RoofAreaCalculator'
import LengthConverter from './LengthConverter'
import ImageCarousel from './ImageCarousel'
import YouTubeEmbed from './YouTubeEmbed'

/**
 * Renders migrated WordPress content.
 *
 * Design goal: a reader who bookmarked one of these pages last month should
 * not notice anything changed except that it loaded faster. Typography sizes,
 * heading weights and spacing are matched to the existing site.
 */

function slugifyHeading(children: unknown): string {
  const text = extractText(children)
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function extractText(node: unknown): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as any)) {
    return extractText((node as any).props?.children)
  }
  return ''
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="my-5 leading-[1.75] text-white">{children}</p>
    ),
    h2: ({ children }) => (
      <h2
        id={slugifyHeading(children)}
        className="mt-10 mb-4 scroll-mt-32 text-2xl font-bold leading-snug text-white sm:text-[1.75rem]"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={slugifyHeading(children)}
        className="mt-8 mb-3 scroll-mt-32 text-xl font-bold leading-snug text-white"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-semibold text-white">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-white bg-white/10 px-5 py-4 text-white">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6 leading-relaxed marker:text-white">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-5 list-decimal space-y-2 pl-6 leading-relaxed marker:font-semibold marker:text-white">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    link: ({ value, children }) => {
      const href: string = value?.href || '#'
      const isInternal = href.startsWith('/') || href.includes('idealroofingsystem.com')

      // Salmon, no underline — matches live's own in-content link style, but
      // lightened from the DEFAULT cta red (1.56:1 here, fails WCAG AA on
      // the dark canvas) to cta-light (4.69:1).
      const linkClass = 'font-medium text-cta-light no-underline transition-opacity hover:opacity-80'

      if (isInternal && href.startsWith('/')) {
        return (
          <Link href={href} className={linkClass}>
            {children}
          </Link>
        )
      }

      return (
        <a
          href={href}
          target={value?.newTab || !isInternal ? '_blank' : undefined}
          // nofollow on outbound links only. Internal links must stay
          // followable or you leak your own internal PageRank.
          rel={isInternal ? 'noopener' : 'noopener noreferrer nofollow'}
          className={linkClass}
        >
          {children}
        </a>
      )
    },
  },

  types: {
    legacyImage: ({ value }) => {
      const src = imageSrc(value, 1200)
      if (!src) return null

      return (
        <figure className="my-8">
          <Image
            src={src}
            alt={value.alt || ''}
            width={value.width || 1200}
            height={value.height || 800}
            sizes="(max-width: 768px) 100vw, 760px"
            className="h-auto w-full rounded-lg"
          />
          {value.caption ? (
            <figcaption className="mt-2 text-center text-sm text-white/85">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      )
    },

    /**
     * Price tables. These are the commercial core of the pricelist posts, so
     * they get real care: a proper <table> for semantics and for Google, a
     * horizontal scroll container so nothing is clipped on a phone, and
     * zebra striping so a long price list stays readable.
     *
     * Styling matches the live site's own table exactly: a lighter-blue
     * header row, alternating dark-blue data rows with white text, and a
     * white "label" cell in the first column of every row — confirmed by
     * viewing the rendered table, not guessed.
     */
    priceTable: ({ value }) => {
      const headers: string[] = value?.headers || []
      const rows: Array<{ cells?: string[] }> = value?.rows || []
      if (!rows.length) return null

      // Live styles its price tables inconsistently per post rather than
      // from one shared design — 'forest' matches the stone-coated
      // pricelist's own table exactly (every value below read from its
      // computed styles, not guessed): dark green caption bar with an
      // orange bottom border, a distinctly LIGHTER green header row, plain
      // 1px light-grey cell borders, sharp corners (no border-radius), and
      // the "footnote" is actually the table's own last row with an orange
      // background and dark green italic text, not separate text below it.
      // Every other price table keeps the original 'brand' look.
      const forest = value?.theme === 'forest'

      return (
        <figure className="my-8">
          {value.caption && !forest ? (
            <figcaption className="mb-3 text-base font-semibold text-white">
              {value.caption}
            </figcaption>
          ) : null}

          <div className={cn('overflow-x-auto', forest ? 'border-2 border-forest' : 'rounded-lg border border-white/20')}>
            <table className={cn('w-full min-w-[32rem] border-collapse text-sm', forest && 'border-collapse')}>
              {value.caption && forest ? (
                <caption className="border-b-[3px] border-forest-accent bg-forest px-4 py-4 text-center text-lg font-bold text-white caption-top">
                  {value.caption}
                </caption>
              ) : null}
              {headers.length ? (
                <thead>
                  {/* bg-brand (500), not brand-400: white-on-400 is only 3.68:1, fails WCAG AA */}
                  <tr className={cn('text-left text-white', forest ? 'bg-forest-light' : 'bg-brand')}>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className={cn(
                          'px-4 py-3 font-semibold',
                          forest ? 'border border-[#ddd] text-center text-base' : ''
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={cn(
                      forest
                        ? ''
                        : cn('border-t border-white/10', ri % 2 === 1 && 'bg-white/5')
                    )}
                  >
                    {(row.cells || []).map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          'px-4 py-3 align-top',
                          forest
                            ? cn('border border-[#ddd] text-white', ci === 0 ? 'text-left font-medium' : 'text-center')
                            : ci === 0
                              ? 'bg-white font-medium text-ink'
                              : 'text-white'
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                {forest && value.footnote ? (
                  <tr>
                    <td
                      colSpan={headers.length || undefined}
                      className="bg-forest-accent px-4 py-3 text-center text-sm italic text-forest"
                    >
                      {value.footnote}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {value.footnote && !forest ? (
            <p className="mt-2 text-xs text-white/85">{value.footnote}</p>
          ) : null}
        </figure>
      )
    },

    youtube: ({ value }) => {
      const id = youtubeId(value?.url || '')
      if (!id) return null

      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
            {/* Click-to-load facade, not an eager iframe: a real embed pulls
                in ~850 KiB of YouTube player JS whether or not the visitor
                ever presses play, which was the single biggest chunk of
                unused JavaScript on pages with video. */}
            <YouTubeEmbed id={id} title={value.title} />
          </div>
          {value.title ? (
            <figcaption className="mt-2 text-center text-sm text-white/85">
              {value.title}
            </figcaption>
          ) : null}
        </figure>
      )
    },

    callout: ({ value }) => {
      const tone: string = value?.tone || 'info'
      const styles: Record<string, string> = {
        info: 'border-white bg-white/10',
        tip: 'border-emerald-400 bg-emerald-400/10',
        warning: 'border-amber-400 bg-amber-400/10',
      }

      return (
        <aside className={cn('my-6 rounded-lg border-l-4 p-5', styles[tone] || styles.info)}>
          {value.title ? (
            <p className="mb-2 font-semibold text-white">{value.title}</p>
          ) : null}
          <div className="text-sm leading-relaxed text-white/85 [&>p]:my-2">
            <PortableText value={value.body || []} components={components} />
          </div>
        </aside>
      )
    },

    /**
     * Interactive tools, placed inline in the content.
     *
     * These are the only client-side JavaScript on an otherwise fully static
     * page, and they only load on the pages that actually contain them.
     */
    toolEmbed: ({ value }) => {
      if (value?.tool === 'roofAreaCalculator') return <RoofAreaCalculator />
      if (value?.tool === 'lengthConverter') return <LengthConverter />
      return null
    },

    imageCarousel: ({ value }) => {
      if (!value?.slides?.length) return null
      return <ImageCarousel slides={value.slides} />
    },

    /**
     * Anything the migration script could not confidently convert. Rendering
     * it verbatim is the whole point — the alternative is silently losing
     * content, which is how migrations lose rankings without anyone noticing
     * until the traffic report three weeks later.
     */
    htmlEmbed: ({ value }) => {
      if (!value?.html) return null
      return (
        <div
          className="wp-legacy my-6"
          dangerouslySetInnerHTML={{ __html: value.html }}
        />
      )
    },
  },

  hardBreak: () => <br />,
}

const HEADING_RANK: Record<string, number> = { h2: 2, h3: 3, h4: 4 }

function styleForRank(n: number): 'h2' | 'h3' | 'h4' {
  if (n <= 2) return 'h2'
  if (n === 3) return 'h3'
  return 'h4'
}

/**
 * Money pages render the article title as H1. Imported WordPress bodies
 * still jump (H1 → H3, or H2 → H4). Walk the blocks and pull any skip
 * back to the next legal level so the outline stays sequential.
 */
function normalizeHeadingOrder(value: any, floor: number): any {
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

export function PortableBody({
  value,
  fixHeadingOrder = false,
}: {
  value: any
  fixHeadingOrder?: boolean
}) {
  if (!value) return null
  const blocks = fixHeadingOrder ? normalizeHeadingOrder(value, 1) : value
  return (
    <div className="portable-body">
      <PortableText value={blocks} components={components} />
    </div>
  )
}

export default PortableBody
