---
paths:
  - "src/app/**/*.tsx"
  - "src/app/**/*.ts"
  - "src/lib/seo.ts"
  - "src/lib/schema.ts"
  - "src/lib/redirects.js"
  - "src/middleware.ts"
  - "next.config.mjs"
---

# SEO rules

This site has existing rankings that took years to earn. These files are where
they get lost. Treat every change here as higher-risk than it looks.

## Metadata

- Build page metadata with `buildMetadata()` from `@/lib/seo`. Do not hand-roll
  a `Metadata` object — you will forget the canonical or the robots directives.
- `DEFAULT_ROBOTS` reproduces the live site's Rank Math output exactly:
  `max-snippet:-1`, `max-image-preview:large`, `max-video-preview:-1`. These are
  what let Google show full snippets and large thumbnails. Dropping them shrinks
  every search listing, which costs click-through even at unchanged rankings.
- Every indexable page needs a self-referencing canonical. Paginated archives
  (`/page/2/`) are self-canonical, NOT canonical to page 1 — canonicalising them
  back to page 1 hides those posts from the index.
- `noindex` is a loaded gun. Only `/search/`, preview deploys, and documents
  where an editor explicitly set `seo.noIndex`.

## URLs

- Always trailing-slash. Use `absoluteUrl()` rather than concatenating.
- Adding a route under `src/app/` that collides with a content slug requires
  adding that segment to `RESERVED_SLUGS` in `@/lib/site`.
- Prefer keeping a URL alive over redirecting it. A 301 loses a little value
  every time; a URL that simply keeps working loses none.
- New redirects go in `src/lib/redirects.js` with `permanent: true`.

## Structured data

- Emit ONE connected `@graph` via `graph()` from `@/lib/schema`, not separate
  islands. Rank Math cross-references Organization/WebSite/Article/Breadcrumb by
  `@id`; disconnected schemas technically validate but Google resolves the
  relationships far less reliably, which is how sites lose rich results after a
  migration even though every schema "passes".
- Do not add `Review` or `AggregateRating` markup for reviews the business
  collected about itself on its own pages. Google's guidelines disallow
  self-serving review markup and it risks a manual action. The existing
  `aggregateRating` on the Organization reflects third-party Google reviews.

## After changing anything here

Run `npm run build`, then `npm run verify -- <url>`. A wave of unexpected 301s
almost always means `trailingSlash` got disturbed.
