import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { site } from '@/lib/site'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || site.url

  // Belt and braces: preview deployments must never be indexed, even if the
  // X-Robots-Tag header in next.config.mjs were somehow bypassed. Checking the
  // actual request host (not just VERCEL_ENV) also catches the one-off Vercel
  // quirk where a brand-new project's first deploy is auto-promoted to
  // "production" despite the real domain not being attached yet — see
  // middleware.ts's isNonCanonicalHost().
  const requestHost = (await headers()).get('host')
  let canonicalHost: string | null = null
  try {
    canonicalHost = new URL(base).hostname
  } catch {
    canonicalHost = null
  }

  if (
    process.env.VERCEL_ENV === 'preview' ||
    (canonicalHost && requestHost && requestHost !== canonicalHost)
  ) {
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
