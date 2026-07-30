# Ideal Roofing System — Next.js + Sanity + Vercel

Migration target for [idealroofingsystem.com](https://idealroofingsystem.com), currently on WordPress.

**Read [`MIGRATION-PLAN.md`](./MIGRATION-PLAN.md) first.** It has the phased plan, the cutover runbook and the rollback procedure. This file is just how to run the code.

---

## Quick start

```bash
npm install

# 1. Create the Sanity project (writes .env.local for you)
npx sanity@latest init --env

# 2. Export content from WordPress
#    WP admin -> Tools -> Export -> All content
#    Save the file as wordpress-export.xml in this folder

# 3. Convert and import
npm run migrate
npx sanity dataset import sanity-import.ndjson production --replace

# 4. Run it
npm run dev          # site      -> http://localhost:3000
                     # CMS       -> http://localhost:3000/studio
```

---

## Before you deploy

Fill in `src/lib/site.ts` — the `business` block has `TODO` placeholders for your street address, phone, postcode and coordinates. These feed your LocalBusiness structured data, and they must match your Google Business Profile **exactly**. Local pack rankings are sensitive to NAP consistency and this is the easiest thing to get subtly wrong, so I left them blank rather than guess.

Add two files to `public/`: `favicon.ico` and `apple-touch-icon.png`. The layout references both. Grab them from your current WordPress install so they don't change.

Paste your Rank Math redirects into `src/lib/redirects.js`. Rank Math → Redirections → Export CSV. These are invisible in your sitemap but they're carrying real link equity from URLs you've already changed once — losing them loses that equity a second time.

---

## Environment variables

Copy `.env.example` to `.env.local`. The ones that matter:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Set by `sanity init` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `SANITY_REVALIDATE_SECRET` | `openssl rand -hex 32`. Also set it on the Sanity webhook. |
| `SANITY_API_WRITE_TOKEN` | Only needed for the comment form. Without it the form degrades gracefully. Editor-scoped token from sanity.io/manage. |
| `MEDIA_ORIGIN` | Where `/wp-content/uploads/*` is served from. **Leave unset during the 30-day overlap** — it proxies from the live WordPress host. Set it before you decommission WP, or every historical image URL dies with it. |
| `NEXT_PUBLIC_SITE_URL` | `https://idealroofingsystem.com` |

---

## Verification

```bash
# Every known URL returns 200 or an intended 301
npm run verify -- https://your-preview.vercel.app

# Old vs new content comparison — catches silently truncated posts
node scripts/verify-urls.mjs --diff https://idealroofingsystem.com https://your-preview.vercel.app
```

The first must be fully green before you touch DNS. The second must show no page losing more than ~5% of its words, and **no page losing a table**. Your pricelist tables are the content that actually ranks.

---

## Project structure

```
src/
  app/
    layout.tsx                          root layout, GTM, AdSense, JSON-LD
    page.tsx                            homepage
    [slug]/page.tsx                     posts, pages AND category archives
    blogs-and-projects/page.tsx         blog index
    blogs-and-projects/page/[page]/     /page/2/, /page/3/ ...
    tag/[slug]/page.tsx                 tag archives
    author/[slug]/page.tsx              author archives
    search/page.tsx                     site search (noindex)
    api/comments/route.ts               comment submission (moderated)
    sitemap.ts  robots.ts  feed.xml/    replaces the Rank Math sitemap + WP feed
    api/revalidate/route.ts             Sanity publish webhook
  components/                           header, footer, cards, Portable Text renderer
    RoofAreaCalculator.tsx              the /roof-area-calculator/ tool
    LengthConverter.tsx                 feet <-> metres
    Comments.tsx / CommentForm.tsx      reader comments
    SearchBox.tsx                       header search
  lib/
    site.ts                             site constants  ← fill in the TODOs
    roof.ts                             roof geometry (unit tested)
    seo.ts                              metadata builder (Rank Math parity)
    schema.ts                           JSON-LD @graph
    redirects.js                        301s  ← paste Rank Math redirects here
  middleware.ts                         410s, legacy ?p=123 resolution

sanity/
  schemas/                              post, page, category, tag, author, settings
  queries.ts                            GROQ

scripts/
  wp-to-sanity.mjs                      WXR → NDJSON importer
  verify-urls.mjs                       pre-cutover gate
```

### Why one catch-all route for three content types

Your WordPress permalinks are flat and the `/category/` base is stripped, so a single root-level slug can be a post (`/price-of-alu-zinc-in-lagos/`), a page (`/pricelist/`) or a category archive (`/blogs/`). `src/app/[slug]/page.tsx` resolves in that precedence order, matching WordPress's own behaviour. Splitting them into separate route segments would have meant changing URLs, which is the one thing this migration exists to avoid.

---

## Things that are load-bearing — don't change casually

**`trailingSlash: true` in `next.config.mjs`.** WordPress serves every URL with a trailing slash. Turning this off makes every indexed URL and every backlink you have point at a redirect, site-wide, on the same day. This one line is most of the difference between a clean migration and a months-long recovery.

**Slugs.** A slug is a URL is a ranking. If you must change one, add a 301 to `src/lib/redirects.js` in the same commit.

**`updatedAt` dates.** The importer preserves the real WordPress values. Don't bulk-reset them — a sitemap where every `lastmod` is today reads to Google as a simultaneous site-wide rewrite.

**The `verification` block in `src/app/layout.tsx`.** Those tags prove domain ownership to Google, Bing, Facebook and Pinterest. Dropping any one silently disconnects a webmaster tool or an ad account, and you find out weeks later.

---

## Two things the audit turned up

**A published post is missing from your sitemap.** `/nine-factors-to-consider-when-choosing-a-roofing-material/` is live and linked from your blog index, but it's absent from `post-sitemap.xml`. Google may not know it exists. It's included in `scripts/verify-urls.mjs` and in the new sitemap, so the migration fixes it — but it's worth knowing that Rank Math has been dropping it.

**Two URLs appear in two sitemaps.** `/privacy-policy/` and `/about-us/` are listed in both `post-sitemap.xml` and `page-sitemap.xml` — you likely have both a post and a page at each slug, with one shadowing the other. The importer will create both documents; the catch-all resolves post-first, matching current behaviour. Worth cleaning up in WordPress before you export, or at least deciding which one you want to keep.

---

## After launch

Publishing in Sanity Studio triggers `/api/revalidate` and the affected page rebuilds in a couple of seconds. Set the webhook up in Sanity: **Manage → API → Webhooks**

- URL: `https://idealroofingsystem.com/api/revalidate`
- Trigger on: create, update, delete
- Secret: same value as `SANITY_REVALIDATE_SECRET`
- Projection: `{_type, "slug": slug.current}`

Without it, pages still refresh — just on the hourly fallback instead of instantly.
