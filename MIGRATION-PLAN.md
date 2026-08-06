# Ideal Roofing System — WordPress → Vercel Migration Plan

**Target stack:** Next.js 15 (App Router) + Sanity CMS + Vercel
**Constraint:** zero ranking loss, design stays visually identical
**Audited inventory (live site, today):** 38 posts · 7 pages · 6 category archives · 54 tag archives · 2 author archives · ~200 media files

---

## 0. The three things that actually kill rankings in a migration

Not the CMS choice. Not the framework. These:

**1. Trailing slashes change.**
WordPress serves `/price-of-alu-zinc-in-lagos/`. Next.js defaults to `/price-of-alu-zinc-in-lagos`. Suddenly every indexed URL and every backlink you've ever earned points at a redirect. Site-wide, all at once.
→ Fixed by `trailingSlash: true` in `next.config.mjs`. Already set. Do not change it.

**2. `/wp-content/uploads/` starts 404-ing.**
Your images rank in Google Images and are hotlinked from your Pinterest and Facebook. Kill those URLs and you lose that traffic *and* Google recrawls your site finding broken assets.
→ Fixed by keeping `/wp-content/uploads/*` alive as a rewrite. Already wired; you just set `MEDIA_ORIGIN`.

**3. Content gets silently truncated on import.**
HTML tables, YouTube embeds and galleries get dropped by naive HTML→CMS converters. Your price tables *are* the ranking content on the pricelist posts — losing them is losing the page.
→ Fixed by custom deserializers in `scripts/wp-to-sanity.mjs`, plus the mandatory word-count diff in Phase 2.

Everything below is organised around not doing those three things.

---

## 1. URL inventory — the complete list that must keep working

### Posts — 38 URLs, flat `/%postname%/` permalinks
Served by `src/app/[slug]/page.tsx`. Full list lives in `scripts/verify-urls.mjs`. The revenue ones:

```
/price-of-aluminium-roofing-sheets-in-2026/
/price-of-stone-coated-gerard-in-lagos-2025/
/price-of-pvc-rain-gutter-water-collector/
/aluminium-roofing-sheets-types-grades-price/
/colour-chart-for-aluminium-roofing-sheet-in-nigeria/
/price-of-alu-zinc-in-lagos/
```

### Pages — 8 URLs
```
/
/pricelist/
/services/
/about-us/
/roofprojects/
/roof-area-calculator/                    ← see §6
/thank-you-for-placing-an-order-with-us/
/privacy-policy/
```

### Category archives — 6 URLs
Your install strips the `/category/` base, so these sit at root:
```
/blogs/   /projects/   /quotation/
/aluminium-pricelist/   /stone-coated-pricelist/   /pvc/
```
Same catch-all route handles them. Resolution order is **post → page → category**, matching WordPress's own behaviour.

### Tag archives — 54 URLs
`/tag/aluminium/`, `/tag/longspan-price/`, `/tag/gerard/`, … → `src/app/tag/[slug]/page.tsx`

### Blog index + pagination — 5 URLs
```
/blogs-and-projects/
/blogs-and-projects/page/2/   /page/3/   /page/4/
```
Worth knowing: `/blogs-and-projects/` is stored as a **post** in your WP install (it shows up in `post-sitemap.xml`), not a page. The code special-cases it as the blog index and excludes it from the catch-all so it can't collide.

### Author archives — 2 URLs
`/author/mcmichael/` · `/author/ruth/`

### Infrastructure
```
/sitemap_index.xml            → 301 → /sitemap.xml   (GSC has this path; keep it alive)
/post-sitemap.xml etc.        → 301 → /sitemap.xml
/robots.txt                   → src/app/robots.ts
/feed/                        → src/app/feed.xml/route.ts
/wp-content/uploads/*         → rewrite to MEDIA_ORIGIN
/?p=123  /?page_id=N          → middleware.ts resolves legacy numeric IDs
/wp-admin/ /wp-login.php /xmlrpc.php → 410 Gone (kills the brute-force bot traffic)
```

**Gate:** `node scripts/verify-urls.mjs https://your-preview.vercel.app` must be 100% green before DNS is touched.

---

## 2. Phase 1 — Export from WordPress (safe, do it today)

Nothing in this phase affects the live site.

1. **WP admin → Tools → Export → All content → Download Export File.**
   Save as `wordpress-export.xml` in the project root. This WXR file carries posts, pages, taxonomies, authors — and every Rank Math field (`rank_math_title`, `rank_math_description`, `rank_math_canonical_url`, `rank_math_robots`, `rank_math_focus_keyword`).

2. **Back up `/wp-content/uploads/`** via cPanel File Manager or SFTP. Roughly 200 files spanning `2020/08` → `2026/07`.

3. **Export Rank Math redirects** (Rank Math → Redirections → Export CSV) if you have any. Paste them into `src/lib/redirects.js`.

4. **Snapshot your GSC baseline — this is the step people skip and regret.**
   Search Console → Performance → Pages → Export last 3 months to CSV. Also export the Coverage "indexed pages" count. Without this you have no way to tell whether a wobble in week 2 is normal recrawl noise or a real problem.

5. **Record current Core Web Vitals** — PageSpeed Insights on `/` and on `/price-of-aluminium-roofing-sheets-in-2026/`. You'll want the before/after.

---

## 3. Phase 2 — Import into Sanity

```bash
npm install
npx sanity@latest init --env                            # creates the project, writes .env.local
node scripts/wp-to-sanity.mjs wordpress-export.xml      # → sanity-import.ndjson
npx sanity dataset import sanity-import.ndjson production --replace
```

What the importer guarantees:

- **Exact slugs preserved.** This is the entire ballgame — a slug change is a lost page.
- **Original `publishedAt` and `updatedAt` preserved.** If every `lastmod` in your sitemap resets to today, Google reads it as a site-wide rewrite and recrawls everything with suspicion. Keep the real dates.
- **Rank Math meta carried into a `seo` object** on every document, so titles and descriptions in the SERPs don't change.
- **Tables, iframes, figures and images survive** via custom deserializers.
- **Nothing is dropped silently.** Anything the converter can't confidently handle becomes an `htmlEmbed` block, rendered as-is, and logged to console so you can review it.

### The content diff — do not skip this

```bash
node scripts/verify-urls.mjs --diff https://idealroofingsystem.com https://your-preview.vercel.app
```

Fetches both versions of every URL, strips nav/footer chrome, compares word counts. **Investigate anything over 5% delta.** Focus hardest on:

| URL | Why it's fragile |
|---|---|
| `/price-of-aluminium-roofing-sheets-in-2026/` | price tables |
| `/price-of-stone-coated-gerard-in-lagos-2025/` | price tables + 7 images |
| `/price-of-pvc-rain-gutter-water-collector/` | 14 images |
| `/colour-chart-for-aluminium-roofing-sheet-in-nigeria/` | SVG colour chart |

These four are almost certainly your top organic earners. A missing table on any of them is a genuine ranking loss, and it's the kind of thing that's invisible until traffic drops three weeks later.

### Images — two routes

**Option A (recommended): keep the old URLs alive.**
Upload the uploads folder to Vercel Blob or Cloudflare R2, set `MEDIA_ORIGIN` in env. `next.config.mjs` already rewrites `/wp-content/uploads/:path*` → `MEDIA_ORIGIN/uploads/:path*`. Every historical image URL keeps returning 200 — Google Images, Pinterest pins and Facebook shares all keep working. New content goes to Sanity's CDN. Zero image-traffic risk.

**Option B: migrate everything into Sanity, 301 the old paths.**
Tidier long-term, but that's ~200 redirects and a temporary dip in image search traffic. Only worth it if single-source-of-truth matters more to you than the short-term dip.

---

## 4. Phase 3 — Parity checklist

Everything below was read off your live HTML and reimplemented:

| Item | Live now | In the new build |
|---|---|---|
| Trailing slashes | `/slug/` | `trailingSlash: true` |
| Canonicals | Rank Math | `alternates.canonical`, per page |
| Meta robots | `follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large` | replicated verbatim in `src/lib/seo.ts` |
| OG + Twitter cards | Rank Math | Metadata API, per page |
| `theme-color` | `#2f5aae` | `viewport.themeColor` |
| Verification tags | Google, Bing `msvalidate.01`, Norton, Pinterest `p:domain_verify`, Facebook domain | root metadata `verification` + `other` |
| LocalBusiness schema | Rank Math Local | `src/lib/schema.ts` — **fill in the TODOs** |
| Article / Breadcrumb schema | Rank Math | per-post JSON-LD |
| VideoObject | video-sitemap | emitted for posts with a `videoUrl` |
| GTM `GTM-P4W26V5G` | plugin | `@next/third-parties/google` |
| AdSense `ca-host-pub-2644536267352236` | Site Kit | root layout script |
| WhatsApp float | plugin | `src/components/WhatsAppFloat.tsx` |
| Sitemap | `/sitemap_index.xml` | `/sitemap.xml` + 301s from all old paths |

**Two things only you can verify:**

1. **LocalBusiness NAP.** Name, address and phone in `src/lib/site.ts` must be byte-identical to your Google Business Profile — "Agege, Lagos" vs "Agege Lagos" is a real difference to the local pack. I've left them as `TODO` rather than guess.
2. **AdSense.** You're on Site Kit's host account. Confirm the site stays approved after the platform change, and expect auto-ad placement (and RPM) to shift for ~2 weeks regardless of what you do. That's the ad system relearning the layout, not a problem with the migration.

---

## 5. Phase 4 — Cutover

Do it **Tuesday or Wednesday morning**. Never Friday, never before a holiday. Be available for the next 48 hours.

### T-7 days
- Deploy to a Vercel preview URL. Preview deploys emit `X-Robots-Tag: noindex` (already configured) — an indexed staging copy is a duplicate-content mess that takes months to unwind.
- Run `scripts/verify-urls.mjs` in both plain and `--diff` mode. Fix everything red.
- **TTL: not applicable.** The domain's DNS is managed on Cloudflare, not a plain registrar, and every record is currently proxied (orange cloud). Proxied records don't carry a manually-set TTL — Cloudflare's network already makes config changes take effect near-instantly, so there's no week-ahead TTL step to do and no waiting period before T-0.

### T-1 day
- Re-export and re-import if you've published anything since Phase 1.
- Screenshot the homepage, blog index and the four price pages for side-by-side comparison.

### T-0
1. Stop editing WordPress (maintenance mode optional).
2. Add both apex and `www` as domains in Vercel; it'll show the `A`/`CNAME` values to use. In **Cloudflare → DNS → Records**, update the `A` record for `@` and the `CNAME` for `www` to those values, and switch both records' cloud icon to **grey ("DNS only")**. Leaving them orange/proxied means traffic still routes through Cloudflare's proxy in front of Vercel, which complicates Vercel's own SSL issuance and isn't necessary — Vercel's edge already provides the CDN/SSL Cloudflare was giving WordPress.
3. **Keep the same canonical host you have today.** If you're on apex now, stay on apex. Changing www ↔ apex during a platform migration means two variables and no way to attribute a drop.
4. Wait for SSL (2–10 min).
5. Run `scripts/verify-urls.mjs` against the live domain.
6. Sanity check: `curl -I https://idealroofingsystem.com/price-of-aluminium-roofing-sheets-in-2026/` must return **200**, not 301.

### T+1 hour
- GSC → Sitemaps → submit `https://idealroofingsystem.com/sitemap.xml`. Leave the old `sitemap_index.xml` entry in place — it 301s, which is exactly the signal you want Google to see.
- GSC → URL Inspection → Request Indexing on your top 6 URLs, one at a time. Tedious, but it meaningfully accelerates recrawl on the pages that pay.
- Same in Bing Webmaster Tools.
- Confirm GTM fires (GA4 realtime should light up).

### Do NOT do any of this at cutover
Change slugs · consolidate thin content · redesign · delete tag archives · switch canonical host · "tidy up" anything.

One variable at a time. If rankings move, you need to be able to say why. All cleanup waits until T+60.

**Keep WordPress hosting paid and running for 30 days.** That's your rollback, and it's cheap insurance.

---

## 6. Open item: `/roof-area-calculator/`

You didn't pick the calculator for rebuild — but it's in your main navigation on **every page** and it's in your page sitemap. It's an indexed URL with site-wide internal links pointing at it. If it 404s at cutover you lose the page *and* every one of those internal links becomes broken, which is a site-wide quality signal.

The code as delivered takes the safe middle path: **the URL stays live and renders its content from Sanity like any other page** — text, images, headings all intact, just without the interactive calculator widget. Nothing 404s, nothing is delinked.

Your options from there:

1. **Rebuild the calculator** as a React component. Maybe two hours. Say the word and I'll do it.
2. **Leave it as the static page** and add the tool back whenever. Preserves 100% of the SEO value today.
3. **301 to `/pricelist/`** — only if GSC shows the page earns negligible traffic. Check before you decide.

**Same question for your forms.** You didn't select quote/contact forms, so pages render without them. If there's a live lead-capture form on `/pricelist/`, `/services/`, or feeding `/thank-you-for-placing-an-order-with-us/`, that's lost conversion, not lost ranking — but it's worth confirming what's actually on those pages before cutover, because the thank-you page in your sitemap suggests something is submitting to it.

---

## 7. Post-launch monitoring — 90 days

**Daily, first 14 days**
- GSC Coverage — watch "Not found (404)" and "Page with redirect". A handful of old attachment URLs is normal. Dozens of new 404s means something's broken.
- GSC Performance — rolling 7-day clicks vs. your Phase 1 baseline.
- Vercel Analytics — 404 rate.

**What normal looks like:** impressions dip 5–15% in weeks 1–2 while Google recrawls, then recover and usually *exceed* baseline by week 4–6. The speed gain is real and Core Web Vitals is a ranking factor.

**What isn't normal:** a specific high-value URL dropping out of the index, or decline still deepening past week 4. Both mean a technical fault, not recrawl noise — check that URL's canonical tag, robots directive, and rendered content in that order.

**Weekly**
- Re-run `scripts/verify-urls.mjs`.
- Core Web Vitals in GSC — should go green across the board.
- Eyeball the `site:idealroofingsystem.com` result count for stability.

**T+30** — if stable, decommission WordPress hosting. Keep the export XML and uploads backup permanently, not just for 30 days.

**T+60 onward** — *now* you improve things. Top of the list: those 54 tag archives against 38 posts. Several tags have exactly one post, which is thin, near-duplicate content. Consolidating them is a real win — but it's a separate project with its own before/after measurement.

---

## 8. Rollback

Revert DNS in Cloudflare: point the `A`/`CNAME` records back at the WordPress host's values and re-enable proxying (orange cloud) if it was on before. Because this is Cloudflare rather than a plain registrar, the change propagates in minutes, not hours — that's the whole reason WordPress stays online for 30 days, as cheap insurance regardless.

**Pull the trigger if:** site-wide 500s · wrong content being served · a top-5 URL 404-ing · >30% traffic drop sustained over 24 hours.

Anything smaller than that, fix forward. Rolling back has its own cost.

---

## 9. What you actually gain

This isn't a lateral move:

- **LCP from ~3–5s to under 1.5s.** WP Rocket was caching around a plugin-heavy stack; static generation removes the problem rather than hiding it.
- **No plugin attack surface.** No security updates, no `wp-login.php` brute-force traffic, no plugin conflicts after an update.
- **Hosting cost → $0.** Vercel Hobby and Sanity's free tier both comfortably cover your traffic and content volume.
- **Edge-cached HTML for Nigerian visitors** instead of every request round-tripping to one origin server.

That speed improvement is itself worth ranking positions on mobile — which, for a Nigerian roofing search, is where nearly all your traffic is.
