import type { Metadata } from 'next'
import { site } from './site'
import { imageSrc } from '../../sanity/image'

/**
 * Reproduces Rank Math's output exactly.
 *
 * Every default here was read off your live HTML. The robots directives in
 * particular (max-snippet:-1, max-image-preview:large, max-video-preview:-1)
 * are what currently allow Google to show full snippets and large image
 * thumbnails for your pages. Dropping them would visibly shrink your search
 * listings, which costs click-through even at unchanged rankings.
 */

export const DEFAULT_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large' as const,
    'max-video-preview': -1,
  },
}

const NOINDEX_ROBOTS = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || site.url
  if (!path || path === '/') return base + '/'
  const clean = path.startsWith('/') ? path : '/' + path
  // Trailing slash everywhere, matching WordPress and next.config.mjs.
  return base + (clean.endsWith('/') ? clean : clean + '/')
}

type SeoInput = {
  title?: string | null
  description?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean | null
  ogImage?: any
} | null | undefined

type BuildMetadataArgs = {
  /** Path with leading and trailing slash, e.g. '/price-of-alu-zinc-in-lagos/' */
  path: string
  /** Fallback title if no SEO override exists. */
  title: string
  /** Fallback description. */
  description?: string | null
  /** The seo object from Sanity (imported from Rank Math). */
  seo?: SeoInput
  /** Featured / hero image, used for og:image when seo.ogImage is absent. */
  image?: any
  type?: 'website' | 'article'
  publishedTime?: string | null
  modifiedTime?: string | null
  authorName?: string | null
}

export function buildMetadata({
  path,
  title,
  description,
  seo,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  authorName,
}: BuildMetadataArgs): Metadata {
  const finalTitle = seo?.title || title
  const finalDescription = seo?.description || description || site.description
  const canonical = seo?.canonicalUrl || absoluteUrl(path)

  const ogImageUrl =
    imageSrc(seo?.ogImage, 1200) ||
    imageSrc(image, 1200) ||
    absoluteUrl(site.logo).replace(/\/$/, '')

  const metadata: Metadata = {
    title: finalTitle,
    description: finalDescription,
    alternates: { canonical },
    robots: seo?.noIndex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS,
    openGraph: {
      type,
      url: canonical,
      title: finalTitle,
      description: finalDescription,
      siteName: site.name,
      locale: site.locale,
      images: ogImageUrl ? [{ url: ogImageUrl, alt: finalTitle }] : undefined,
      ...(type === 'article'
        ? {
            publishedTime: publishedTime || undefined,
            modifiedTime: modifiedTime || undefined,
            authors: authorName ? [authorName] : undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: site.social.twitterHandle,
      creator: site.social.twitterHandle,
      title: finalTitle,
      description: finalDescription,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }

  return metadata
}

/**
 * Paginated archives. Google no longer uses rel=prev/next as an indexing
 * signal, but page 2+ should still be self-canonical rather than pointing at
 * page 1 — pointing them all at page 1 hides those posts from the index.
 */
export function paginationMetadata(basePath: string, page: number): Metadata {
  return {
    alternates: {
      canonical:
        page <= 1 ? absoluteUrl(basePath) : absoluteUrl(basePath + 'page/' + page + '/'),
    },
  }
}
