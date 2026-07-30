import type { MetadataRoute } from 'next'
import { site, POSTS_PER_PAGE } from '@/lib/site'
import { absoluteUrl } from '@/lib/seo'
import { imageSrc } from '../../sanity/image'
import { sanityFetch } from '../../sanity/client'
import { sitemapQuery, sitemapMediaQuery } from '../../sanity/queries'

/**
 * Replaces Rank Math's /sitemap_index.xml.
 *
 * Rank Math split the sitemap across eight files (post, page, category, tag,
 * attachment, news, video, local). One file is simpler and well within
 * Google's 50,000-URL limit at your ~115 URLs. Every old path 301s here (see
 * redirects.js) so Search Console follows along without losing its submission
 * history.
 *
 * Three deliberate choices:
 *
 * - `lastModified` uses the ORIGINAL WordPress dates, not the build date. If
 *   every lastmod became today, Google would read it as a simultaneous rewrite
 *   of the whole site. Honest dates get honest crawl behaviour.
 *
 * - Image entries are included, matching what the Rank Math image sitemap did.
 *   Your images rank in Google Images and that traffic is worth keeping.
 *
 * - Video entries are included for posts with a video, replacing the old
 *   video-sitemap.xml.
 */

export const revalidate = 3600

type SitemapData = {
  posts: Array<{ slug: string; updatedAt?: string; publishedAt?: string }>
  pages: Array<{ slug: string; updatedAt?: string }>
  categories: Array<{ slug: string; updatedAt?: string }>
  tags: Array<{ slug: string; updatedAt?: string }>
  authors: Array<{ slug: string }>
}

type MediaImage = { asset?: unknown; legacyUrl?: string; alt?: string }
type MediaData = {
  posts: Array<{
    slug: string
    title?: string
    excerpt?: string
    videoUrl?: string
    publishedAt?: string
    images?: MediaImage[]
  }>
  pages: Array<{ slug: string; images?: MediaImage[] }>
}

// Pricelist pages are the commercial core and change most often.
const HIGH_PRIORITY = new Set([
  'price-of-aluminium-roofing-sheets-in-2026',
  'price-of-stone-coated-gerard-in-lagos-2025',
  'price-of-pvc-rain-gutter-water-collector',
  'price-of-alu-zinc-in-lagos',
  'pricelist',
  'roof-area-calculator',
])

function when(...values: Array<string | undefined>): Date {
  for (const v of values) {
    if (!v) continue
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

/** Absolute URLs for every image on a page, deduplicated, capped at 20. */
function imageUrls(images?: MediaImage[]): string[] {
  if (!images?.length) return []
  const urls = new Set<string>()
  for (const img of images) {
    const src = imageSrc(img, 1600)
    if (!src) continue
    urls.add(src.startsWith('http') ? src : absoluteUrl(src).replace(/\/$/, ''))
    // Google ignores anything past ~1000 images per URL; 20 is plenty and
    // keeps the sitemap small enough to parse quickly.
    if (urls.size >= 20) break
  }
  return [...urls]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: SitemapData
  let media: MediaData | null = null

  try {
    data = await sanityFetch<SitemapData>({
      query: sitemapQuery,
      tags: ['post', 'page', 'category', 'tag', 'author'],
    })
  } catch {
    // Never serve a broken sitemap. A minimal valid one beats a 500, which
    // Search Console records as a fetch error against your submission.
    return [{ url: absoluteUrl('/'), lastModified: new Date(), priority: 1 }]
  }

  // Media is a nice-to-have. If it fails, ship the sitemap without it rather
  // than failing the whole thing.
  try {
    media = await sanityFetch<MediaData>({
      query: sitemapMediaQuery,
      tags: ['post', 'page'],
    })
  } catch {
    media = null
  }

  const postMedia = new Map((media?.posts || []).map((p) => [p.slug, p]))
  const pageMedia = new Map((media?.pages || []).map((p) => [p.slug, p]))

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ]

  for (const p of data.pages || []) {
    if (p.slug === 'home' || !p.slug) continue
    const images = imageUrls(pageMedia.get(p.slug)?.images)
    entries.push({
      url: absoluteUrl('/' + p.slug + '/'),
      lastModified: when(p.updatedAt),
      changeFrequency: 'monthly',
      priority: HIGH_PRIORITY.has(p.slug) ? 0.9 : 0.7,
      ...(images.length ? { images } : {}),
    })
  }

  for (const p of data.posts || []) {
    if (!p.slug) continue
    const m = postMedia.get(p.slug)
    const images = imageUrls(m?.images)

    entries.push({
      url: absoluteUrl('/' + p.slug + '/'),
      lastModified: when(p.updatedAt, p.publishedAt),
      changeFrequency: HIGH_PRIORITY.has(p.slug) ? 'weekly' : 'monthly',
      priority: HIGH_PRIORITY.has(p.slug) ? 0.9 : 0.6,
      ...(images.length ? { images } : {}),
      // Replaces the old video-sitemap.xml.
      ...(m?.videoUrl
        ? {
            videos: [
              {
                title: m.title || p.slug,
                thumbnail_loc: images[0] || absoluteUrl(site.logo).replace(/\/$/, ''),
                description: m.excerpt || m.title || p.slug,
                content_loc: m.videoUrl,
                publication_date: m.publishedAt,
              },
            ],
          }
        : {}),
    })
  }

  // Blog index + its pagination, matching the WordPress URL shape.
  const postCount = (data.posts || []).length
  const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
  for (let i = 1; i <= totalPages; i++) {
    entries.push({
      url:
        i === 1
          ? absoluteUrl('/blogs-and-projects/')
          : absoluteUrl('/blogs-and-projects/page/' + i + '/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: i === 1 ? 0.8 : 0.4,
    })
  }

  for (const c of data.categories || []) {
    if (!c.slug) continue
    entries.push({
      url: absoluteUrl('/' + c.slug + '/'),
      lastModified: when(c.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const t of data.tags || []) {
    if (!t.slug) continue
    entries.push({
      url: absoluteUrl('/tag/' + t.slug + '/'),
      lastModified: when(t.updatedAt),
      changeFrequency: 'monthly',
      // Low but present. These are thin pages — 54 tags across 39 posts — and
      // consolidating them is worth doing, but AFTER the migration settles,
      // not during it. Removing them now would be a second variable.
      priority: 0.3,
    })
  }

  for (const a of data.authors || []) {
    if (!a.slug) continue
    entries.push({
      url: absoluteUrl('/author/' + a.slug + '/'),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    })
  }

  // Note: /search/ is deliberately absent. It is noindex — search result
  // pages are the textbook case of low-value crawlable URLs.

  return entries
}
