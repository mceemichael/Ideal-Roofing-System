import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || site.url

  // Belt and braces: preview deployments must never be indexed, even if the
  // X-Robots-Tag header in next.config.mjs were somehow bypassed.
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Query-string URLs would otherwise create infinite crawlable
        // variants of the same page and waste crawl budget.
        disallow: ['/api/', '/studio/', '/*?s=', '/*?p=', '/*?page_id='],
      },
    ],
    sitemap: base + '/sitemap.xml',
    host: base,
  }
}
