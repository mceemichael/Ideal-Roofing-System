import { NextResponse, type NextRequest } from 'next/server'

/**
 * Handles the URL shapes that cannot be expressed as static redirects in
 * next.config.mjs, because they depend on query strings or need a status code
 * other than 301.
 */

/**
 * WordPress endpoints that no longer exist and never will.
 *
 * These get 410 Gone rather than 404 Not Found, deliberately. A 404 tells
 * crawlers "maybe later" and they keep retrying for months; 410 says
 * "permanently gone" and Google drops them from the index far faster.
 *
 * Practical benefit beyond SEO: /wp-login.php and /xmlrpc.php attract constant
 * automated brute-force traffic. Answering instantly at the edge means that
 * traffic never touches a function invocation.
 */
const GONE_PATHS = [
  '/wp-login.php',
  '/wp-register.php',
  '/xmlrpc.php',
  '/wp-cron.php',
  '/wp-config.php',
  '/wp-trackback.php',
  '/wp-comments-post.php',
]

const GONE_PREFIXES = ['/wp-admin', '/wp-content/cache', '/wp-content/mu-plugins']

/**
 * True whenever this request did NOT arrive on the real production hostname —
 * covers ordinary Vercel preview deployments, but also the one-off Vercel
 * quirk where a brand-new project's very first deployment gets auto-promoted
 * to "production" (VERCEL_ENV=production) despite the real custom domain not
 * being attached yet. Checking the actual request host, rather than trusting
 * VERCEL_ENV alone, means this can never accidentally let a *.vercel.app URL
 * get indexed — and it stops applying itself automatically the moment DNS
 * cutover points the real domain here.
 */
function isNonCanonicalHost(req: NextRequest): boolean {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL
  if (!canonical) return false
  try {
    return req.nextUrl.hostname !== new URL(canonical).hostname
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl
  const blockIndexing = isNonCanonicalHost(req)

  // ---- 410 Gone --------------------------------------------------------
  if (
    GONE_PATHS.includes(pathname) ||
    GONE_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return new NextResponse('Gone', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  // ---- Legacy numeric permalinks --------------------------------------
  // Old shares and some backlinks use /?p=123 or /?page_id=456. WordPress
  // resolved these to the real post; without this they would land on the
  // homepage and lose whatever equity they carry.
  const legacyId = searchParams.get('p') || searchParams.get('page_id')
  if (pathname === '/' && legacyId && /^\d+$/.test(legacyId)) {
    try {
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
      const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'

      if (projectId && dataset) {
        const query = encodeURIComponent(
          '*[(_type == "post" || _type == "page") && legacyId == ' +
            Number(legacyId) +
            '][0]{"slug": slug.current}'
        )
        const url =
          'https://' +
          projectId +
          '.apicdn.sanity.io/v' +
          apiVersion +
          '/data/query/' +
          dataset +
          '?query=' +
          query

        const res = await fetch(url, { next: { revalidate: 86400 } })
        if (res.ok) {
          const json = await res.json()
          const slug = json?.result?.slug
          if (slug) {
            return NextResponse.redirect(new URL('/' + slug + '/', req.url), 301)
          }
        }
      }
    } catch {
      // Fall through to the homepage rather than erroring.
    }
  }

  // ---- Legacy WordPress search ----------------------------------------
  // /?s=query was the WordPress search URL, and it is still in browser
  // histories and bookmarks. Forward it to the real search page WITH the
  // query intact, so the visitor lands on results rather than a blank page.
  if (pathname === '/' && searchParams.has('s')) {
    const term = searchParams.get('s') || ''
    const target = new URL('/search/', req.url)
    if (term) target.searchParams.set('q', term)
    return NextResponse.redirect(target, 301)
  }

  // ---- Strip WordPress tracking cruft ---------------------------------
  // ?replytocom= and ?preview= created endless crawlable duplicates of every
  // post. Collapsing them to the clean URL protects crawl budget.
  if (searchParams.has('replytocom') || searchParams.has('preview_id')) {
    const clean = req.nextUrl.clone()
    clean.search = ''
    return NextResponse.redirect(clean, 301)
  }

  const res = NextResponse.next()
  if (blockIndexing) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return res
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static files. Keeping the
     * matcher tight matters — middleware runs on every matched request and
     * you pay for the invocation.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?)$).*)',
  ],
}
