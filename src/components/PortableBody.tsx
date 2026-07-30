import Image from 'next/image'
import Link from 'next/link'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { imageSrc } from '../../sanity/image'
import { youtubeId } from '@/lib/format'
import { cn } from '@/lib/cn'
import RoofAreaCalculator from './RoofAreaCalculator'
import LengthConverter from './LengthConverter'

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
      <p className="my-5 leading-[1.75] text-ink">{children}</p>
    ),
    h2: ({ children }) => (
      <h2
        id={slugifyHeading(children)}
        className="mt-10 mb-4 scroll-mt-32 text-2xl font-bold leading-snug text-ink sm:text-[1.75rem]"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={slugifyHeading(children)}
        className="mt-8 mb-3 scroll-mt-32 text-xl font-bold leading-snug text-ink"
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-semibold text-ink">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-brand bg-brand-50 px-5 py-4 text-ink-muted">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6 leading-relaxed marker:text-brand">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-5 list-decimal space-y-2 pl-6 leading-relaxed marker:font-semibold marker:text-brand">
        {children}
      </ol>
    ),
  },

  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    link: ({ value, children }) => {
      const href: string = value?.href || '#'
      const isInternal = href.startsWith('/') || href.includes('idealroofingsystem.com')

      if (isInternal && href.startsWith('/')) {
        return (
          <Link href={href} className="font-medium text-brand underline underline-offset-2 hover:text-brand-700">
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
          className="font-medium text-brand underline underline-offset-2 hover:text-brand-700"
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
            <figcaption className="mt-2 text-center text-sm text-ink-light">
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
     */
    priceTable: ({ value }) => {
      const headers: string[] = value?.headers || []
      const rows: Array<{ cells?: string[] }> = value?.rows || []
      if (!rows.length) return null

      return (
        <figure className="my-8">
          {value.caption ? (
            <figcaption className="mb-3 text-base font-semibold text-ink">
              {value.caption}
            </figcaption>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-surface-border">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              {headers.length ? (
                <thead>
                  <tr className="bg-brand text-left text-white">
                    {headers.map((h, i) => (
                      <th key={i} scope="col" className="px-4 py-3 font-semibold">
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
                      'border-t border-surface-border',
                      ri % 2 === 1 && 'bg-surface-soft'
                    )}
                  >
                    {(row.cells || []).map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          'px-4 py-3 align-top text-ink',
                          ci === 0 && 'font-medium'
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {value.footnote ? (
            <p className="mt-2 text-xs text-ink-light">{value.footnote}</p>
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
            <iframe
              // Privacy-enhanced domain: no cookie until the user hits play.
              src={'https://www.youtube-nocookie.com/embed/' + id}
              title={value.title || 'YouTube video'}
              // Lazy so an embed below the fold does not hurt LCP. The
              // WordPress version loaded these eagerly, which is a large part
              // of why the pages with video were slow.
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          {value.title ? (
            <figcaption className="mt-2 text-center text-sm text-ink-light">
              {value.title}
            </figcaption>
          ) : null}
        </figure>
      )
    },

    callout: ({ value }) => {
      const tone: string = value?.tone || 'info'
      const styles: Record<string, string> = {
        info: 'border-brand bg-brand-50',
        tip: 'border-emerald-500 bg-emerald-50',
        warning: 'border-amber-500 bg-amber-50',
      }

      return (
        <aside className={cn('my-6 rounded-lg border-l-4 p-5', styles[tone] || styles.info)}>
          {value.title ? (
            <p className="mb-2 font-semibold text-ink">{value.title}</p>
          ) : null}
          <div className="text-sm leading-relaxed text-ink-muted [&>p]:my-2">
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

export function PortableBody({ value }: { value: any }) {
  if (!value) return null
  return (
    <div className="portable-body">
      <PortableText value={value} components={components} />
    </div>
  )
}

export default PortableBody
