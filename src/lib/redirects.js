/**
 * Permanent redirects.
 *
 * Rule of thumb: your 38 posts, 7 pages, 6 categories and 54 tags all keep
 * their exact URLs, so they are NOT in this list. Redirecting a URL that could
 * simply keep working is a small, unnecessary loss every time.
 *
 * Only genuinely-moved or genuinely-dead paths belong here.
 */

/** @type {import('next').Redirect[]} */
export const redirects = [
  // ---------------------------------------------------------------------
  // Sitemaps. Google Search Console has /sitemap_index.xml on file and will
  // keep requesting it for a long time. A 301 tells it where the new one is.
  // ---------------------------------------------------------------------
  { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/post-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/page-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/category-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/post_tag-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/news-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/video-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/local-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/attachment-sitemap.xml', destination: '/sitemap.xml', permanent: true },
  { source: '/main-sitemap.xsl', destination: '/sitemap.xml', permanent: true },

  // ---------------------------------------------------------------------
  // WordPress plumbing that no longer exists. These are 301'd to the homepage
  // rather than left to 404 because some of them accumulate real backlinks.
  // The genuinely hostile ones (wp-login, xmlrpc) are handled in middleware.ts
  // with a 410 Gone instead, which stops bot traffic faster.
  // ---------------------------------------------------------------------
  { source: '/wp-content/themes/:path*', destination: '/', permanent: true },
  { source: '/wp-content/plugins/:path*', destination: '/', permanent: true },
  { source: '/wp-includes/:path*', destination: '/', permanent: true },
  { source: '/wp-json/:path*', destination: '/', permanent: true },
  { source: '/comments/feed/', destination: '/feed.xml', permanent: true },
  { source: '/feed/', destination: '/feed.xml', permanent: true },
  { source: '/rss/', destination: '/feed.xml', permanent: true },
  { source: '/blogs-and-projects/feed/', destination: '/feed.xml', permanent: true },

  // ---------------------------------------------------------------------
  // WordPress's static-front-page mechanism gives the homepage's own page
  // object a real slug ("home"), but WP redirects that URL to / rather than
  // serving it — confirmed live, /home/ 301s to / with no duplicate content.
  // The Sanity import brought that page object in as a normal page, which
  // the [slug] catch-all would otherwise render as full duplicate content
  // (About Company, team testimonials, etc. — the same copy hardcoded on
  // the homepage). This redirect is what live already does; it isn't new.
  // ---------------------------------------------------------------------
  { source: '/home/', destination: '/', permanent: true },

  // ---------------------------------------------------------------------
  // Legacy paths. The site previously used the ideroofingsystem branding and
  // a /category/ base; anything still linking to those lands correctly.
  // ---------------------------------------------------------------------
  { source: '/category/:slug', destination: '/:slug/', permanent: true },
  { source: '/blog/', destination: '/blogs-and-projects/', permanent: true },
  { source: '/blogs-and-projects/page/1/', destination: '/blogs-and-projects/', permanent: true },
  { source: '/roofprojects/', destination: '/projects/', permanent: true },

  // ---------------------------------------------------------------------
  // Rank Math redirects, exported 2026-07-30. Prior-year pricelist slugs that
  // got renamed when prices were refreshed for the new year — carrying real
  // link equity from old backlinks/bookmarks forward to the current page.
  // ---------------------------------------------------------------------
  {
    source: '/price-of-aluminium-roofing-sheets-in-2025/',
    destination: '/price-of-aluminium-roofing-sheets-in-2026/',
    permanent: true,
  },
  {
    source: '/price-of-stone-coated-gerard-in-lagos-2024/',
    destination: '/price-of-stone-coated-gerard-in-lagos-2025/',
    permanent: true,
  },
]

export default redirects
