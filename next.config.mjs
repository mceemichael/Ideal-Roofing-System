import { redirects } from './src/lib/redirects.js'

/**
 * MEDIA_ORIGIN keeps every historical /wp-content/uploads/* URL alive after
 * cutover. Upload your WordPress uploads folder to Vercel Blob / Cloudflare R2
 * / S3 and point this at it. See MIGRATION-PLAN.md §3.
 *
 * Until it is set, uploads are proxied from the old WordPress host so nothing
 * 404s during the transition. Replace this before you decommission WP.
 */
const MEDIA_ORIGIN =
  process.env.MEDIA_ORIGIN || 'https://idealroofingsystem.com'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * CRITICAL — DO NOT CHANGE.
   * WordPress serves every URL with a trailing slash. Turning this off would
   * make every indexed URL and every backlink point at a redirect, site-wide,
   * on the same day. This single line is the difference between a clean
   * migration and a months-long recovery.
   */
  trailingSlash: true,

  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'idealroofingsystem.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      ...(process.env.MEDIA_ORIGIN
        ? [
            {
              protocol: 'https',
              hostname: new URL(process.env.MEDIA_ORIGIN).hostname,
            },
          ]
        : []),
    ],
  },

  async redirects() {
    return redirects
  },

  async rewrites() {
    return [
      // Keep legacy media URLs alive. Google Images, Pinterest pins and
      // Facebook shares all depend on these exact paths resolving.
      {
        source: '/wp-content/uploads/:path*',
        destination: MEDIA_ORIGIN + '/wp-content/uploads/:path*',
      },
    ]
  },

  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]

    // Never let a preview deployment get indexed. An indexed staging copy is a
    // duplicate-content problem that takes months to unwind.
    if (process.env.VERCEL_ENV === 'preview') {
      headers.push({
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })
    }

    return headers
  },
}

export default nextConfig
