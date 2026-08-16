# Handoff — decisions, state, and what's left

Written to transfer full context to whoever (or whatever) picks this up next. `CLAUDE.md` holds the rules that matter every session; this file holds the *reasoning*, which you only need when a decision looks odd.

**Status: LIVE since 2026-08-04.** DNS is on Cloudflare (grey-cloud / DNS-only) pointing at Vercel. `https://idealroofingsystem.com` is this Next.js app; WordPress is no longer serving public traffic. Uploads live in Vercel Blob (`MEDIA_ORIGIN` is set), so WordPress hosting can be cancelled when Michael is ready. Latest verified work: Bing title/description fixes (2026-08-14); `npm run verify` 110/110, GATE: PASSED. GSC baseline to watch for 90 days: 6.9k clicks / 297k impressions.

---

## 1. What this project is

Migrating **idealroofingsystem.com** — a Nigerian roofing company, WordPress + Elementor + Rank Math + WP Rocket — onto Next.js 15 + Sanity + Vercel.

The owner, Michael, is a business owner, not a developer. He built the WordPress site himself.

His two requirements, verbatim: move **"without dropping in rankings"**, and **"the designs should continue to appear simple as they already are."**

Read the second one as a constraint, not a preference. He is not asking for a redesign and does not want one. Anything that changes how the site looks is scope creep with ranking risk attached.

### What the site earns from

Ordered by commercial value, inferred from navigation prominence, update frequency and content depth:

1. `/price-of-aluminium-roofing-sheets-in-2026/` — price tables
2. `/price-of-stone-coated-gerard-in-lagos-2025/` — price tables + 7 images
3. `/price-of-pvc-rain-gutter-water-collector/` — 14 product images
4. `/roof-area-calculator/` — interactive tool, linked from every page's nav
5. `/pricelist/` — hub page
6. `/colour-chart-for-aluminium-roofing-sheet-in-nigeria/` — SVG colour chart

If you're deciding where to spend verification effort, spend it here.

### Inventory audited from the live sitemaps

39 posts · 7 pages · 6 category archives · 54 tag archives · 2 author archives · ~200 media files. 110 URLs total, all enumerated in `scripts/verify-urls.mjs`.

---

## 2. Decisions the owner made

Asked up front, before any code:

| Question | His answer |
|---|---|
| Content management after the move | **Sanity CMS** (over MDX-in-repo or headless WordPress) |
| Design fidelity | **Near pixel-match, cleaner code** (over modernising or redesigning) |
| Features to rebuild | **Blog listing + categories**, **WhatsApp float + GTM/AdSense** |

He explicitly did *not* select the roof area calculator or the quote/contact forms in that first round. I flagged the calculator as a risk anyway — it's in the main nav on every page — and shipped the page as static content so the URL and its internal links survived. He later asked for it to be rebuilt properly, plus "anything else I may have omitted", which produced comments, search, and the sitemap media entries.

**Forms are still not built.** See §6.

---

## 3. Decisions I made, and why

These are the ones where a reasonable person might have chosen differently.

### `trailingSlash: true`

WordPress serves `/slug/`. Next.js defaults to `/slug`. Getting this wrong points every indexed URL and every backlink at a redirect, site-wide, on the same day — the single biggest cause of migration ranking loss, and it looks fine in testing because everything still resolves. One line, enormous consequence.

### One catch-all route for posts, pages AND categories

His permalinks are flat and the `/category/` base is stripped, so `/blogs/` (category), `/pricelist/` (page) and `/price-of-alu-zinc-in-lagos/` (post) all live at the root. `src/app/[slug]/page.tsx` resolves post → page → category, matching WordPress's own precedence.

The tidier-looking alternative — separate route segments — would have meant changing URLs, which is the one thing this migration exists to avoid.

### Images stay on `/wp-content/uploads/`

Migrating ~200 images into Sanity on day one means ~200 URL changes at the exact moment the site is most fragile. His images rank in Google Images and are hotlinked from his Pinterest.

Instead: `legacyImage` stores either a Sanity asset or the original path, and `next.config.mjs` rewrites `/wp-content/uploads/*` to `MEDIA_ORIGIN`. During the 30-day overlap that's the live WordPress host; before decommissioning it becomes Vercel Blob or R2. Assets can move into Sanity gradually afterwards, one at a time, with redirects.

**This is the step most likely to be forgotten and it breaks every image on the site.** It's called out in `MIGRATION-PLAN.md` §7, `README.md` and `START-HERE.md`.

### `htmlEmbed` as a never-drop-content escape hatch

Every HTML→CMS converter hits markup it can't handle. The common behaviour is to drop it. That's invisible in testing and shows up as a traffic drop three weeks later.

So: anything the importer can't confidently convert becomes an `htmlEmbed` block rendered verbatim, and gets logged. `src/app/globals.css` has a `.wp-legacy` block styling raw HTML to match native content, because some of it will sit there for months.

Corollary: **do not "clean up" `htmlEmbed` blocks by deleting them.** Convert or leave.

### Structured data as one connected `@graph`

Rank Math emits Organization/WebSite/WebPage/Article/BreadcrumbList cross-referenced by `@id`. Emitting them as separate islands validates fine in testing tools but Google resolves the relationships far less reliably — which is how sites lose rich results after a migration while every schema still "passes".

### Comments migrated, not dropped

Easy to treat as optional. The calculator page has six, and they're unique on-page text no competitor has, plus social proof at the moment someone is deciding whether to trust the numbers.

Stored as separate documents (so a new comment doesn't rewrite the post), approved-only on the site, `legacyId` preserved so shared `#comment-468` links keep working. New submissions land unapproved.

Spam handling is honeypot + rate limit + link cap, deliberately **not** a CAPTCHA — CAPTCHAs cost real comments from real people, and this is a business where a comment is often a lead.

### Search page is `noindex`

Search result pages are the textbook case of low-value crawlable URLs, and Google's own guidance is to keep them out. The box works for humans; the results stay out of the index and out of the sitemap. Legacy `/?s=query` URLs 301 to `/search/?q=query` with the term intact.

### Tag archives kept, despite being thin

54 tags for 39 posts, several with a single post. That is genuinely thin, near-duplicate content and consolidating it is a real win.

**But not now.** Doing it during the migration means two variables changing at once, and if rankings move you can't attribute it. `MIGRATION-PLAN.md` schedules this for T+60 days as its own project with its own before/after.

This is the general principle throughout: **one variable at a time.**

---

## 4. Things found during the audit that he didn't know about

- **`/nine-factors-to-consider-when-choosing-a-roofing-material/` is live and linked from the blog index but missing from `post-sitemap.xml`.** Rank Math is dropping it. Included in the new sitemap and in `scripts/verify-urls.mjs`.
- **`/privacy-policy/` and `/about-us/` appear in both the post and page sitemaps** — there's likely a post and a page at each slug, one shadowing the other. The importer creates both; the catch-all resolves post-first, preserving current behaviour. Worth resolving in WordPress before the final export.
- **`/thank-you-for-placing-an-order-with-us/` publishes three bank account numbers and has `6115105062` as its meta description.** That string is what Google would show as the description in search results. The page is currently indexed. Raised; not yet decided.
- **His phone number, `08059431517`, is published on the calculator page.** Used to fill the `telephone` field and add click-to-call. The rest of the NAP block is still `TODO` because guessing an address that must match a Google Business Profile byte-for-byte is worse than leaving it blank.

---

## 5. Verification actually performed

Be precise about this, because the gap matters.

**Done:** all 31 `.ts` files parsed with a real parser (`node --experimental-strip-types --check`); all 27 `.tsx` files bracket-balanced with a string-aware tokenizer; 131 local imports resolved against the filesystem; 116 named imports checked against actual exports; all 14 Sanity schemas confirmed registered with no unknown type references; 110 URLs confirmed unique, well-formed and covering the live sitemap; roof geometry unit-tested (18 assertions, including the identity `A = 2L·√((W/2)² + H²)` and a 45° case); date handling tested against real `lastmod` values from the live sitemap.

**Update (2026-07-29): `npm install` and `npm run build` have now been run for real**, on Michael's own machine (Node v24.18.0, npm 12.0.1). One real bug surfaced, as expected: `src/app/sitemap.ts`'s video-sitemap entries used camelCase keys (`thumbnailLoc`, `contentLoc`, `publicationDate`); Next's `Videos` type wants snake_case (`thumbnail_loc`, `content_loc`, `publication_date`). Fixed. After that, `npm run build` completed cleanly — 11/11 pages prerendered, sitemap/feed/studio all resolved. Nothing has run in a browser yet (that's Session 5).

Also done as part of this: the project was moved out of Claude's local-agent-mode output folder into `C:\Users\chibu\Documents\ideal-roofing-vercel` (Session 3a), and npm's install-scripts gate (a newer npm 12 feature) required approving `sharp` and `esbuild`'s install scripts — both standard, required for Next.js image optimization and Sanity tooling respectively.

**Update (2026-07-30): Session 2 (WordPress export) and Session 4 (import) are done.** Michael exported `wordpress-export.xml` himself and it was migrated + imported: 39 posts, 8 pages, 6 categories, 74 tags, 2 authors, 19 price tables, 115 images, 21 comments, 2 interactive tools, 151 documents total imported into the `production` dataset. Note some counts differ from the numbers this file originally quoted (54 tags → 74, ~6 comments → 21, 3 videos → 0) — the live site has genuinely changed since the original audit, not a migration bug.

**Found and fixed a real bug in the importer** (`scripts/wp-to-sanity.mjs`): the roof-area-calculator page's Length Converter widget was a bare `<!DOCTYPE html><html>...` mini-document pasted mid-content with no wrapping `<div>`/`<form>`/`<section>` around its controls — unlike the roof calculator, which is wrapped in a `<form>`. `detectTool()` only ever inspects DIV/FORM/SECTION container nodes, so the length converter's h1/label/input/select/button fell through one-by-one into individual raw `htmlEmbed` fragments instead of becoming one clean `toolEmbed`, and "Interactive tools" undercounted (1 instead of 2). Added `unwrapEmbeddedDocuments()`, which unwraps any such embedded mini-document down to its `<body>` content inside a synthetic `<div>` before the main parse — gives `detectTool()` exactly the container shape it expects. Verified with a standalone reproduction before touching the production script; re-ran the migration afterward and confirmed "Interactive tools: 2" with no loss elsewhere (raw HTML fallback count dropped from 56 to 49 — exactly the 7 stray title/label/select/button fragments this fixed).

**Still NOT done:** nothing has executed in a browser yet (`npm run dev` / Session 5) — next up.

---

## 6. Open items

**Blocking deploy:**

1. ~~Run `npm install` and `npm run build`. Fix whatever surfaces.~~ **Done 2026-07-29** — see §5 update above. A Sanity project (`t7v0sjij` / dataset `production`) has also been created and `.env.local` populated, but it's still empty (Session 4 not yet run).
2. ~~Fill the `business` block `TODO`s.~~ **Done 2026-07-30** — street address `83 Dopemu Rd, Orile Agege` / `Agege` / `Lagos State`, postal code `102212`, email `info@idealroofingsystem.com`, lat/long `6.618799391108653, 3.312693551024671` (pulled from Michael's Google Business Profile pin). The `geo` block in the JSON-LD (`src/lib/schema.ts`) is conditional on both lat/long being present, so it now emits automatically. `npm run build` passes.
3. ~~Add `public/favicon.ico` and `public/apple-touch-icon.png` from the WordPress install.~~ **Done 2026-07-29** — the live site never actually had dedicated files for these, only one SVG logo used for every icon role. Generated a proper multi-size `.ico` (16/32/48/256) and a 180×180 opaque PNG from that same SVG (`sharp`, cropped to square rather than letterboxed — Apple touch icons can't have transparency).
4. ~~Paste Rank Math redirects into `src/lib/redirects.js`.~~ **Done 2026-07-30** — only 2 active entries in Michael's export, both prior-year pricelist slugs (`...-2025/` → `...-2026/`, `...-2024/` → `...-2025/`). Verified against a running dev server: both 308-redirect to the right destination.

**Should resolve before cutover:**

5. ~~Verify the roof formula against the live calculator.~~ **Done 2026-07-29 — it disagreed, now fixed.** Pulled the live page's actual inline script (`view-source`, not inference): `roofArea = L×W + W×H` (a linear approximation, not real trigonometry). For 12×9×2.5 that's **130.50 m²**, not the 123.55 m² this file originally predicted from a Pythagorean slope formula. `src/lib/roof.ts` now computes `areaSqm` with the live formula; `rafterLength`/`slopeFactor`/`pitchDegrees` stay as real geometry, shown as separate informational stats the live tool never had. `npm run typecheck` passes.
6. ~~Confirm what forms exist on the live site.~~ **Done 2026-08-04** — checked live in-browser: `/pricelist/` and `/services/` have no forms, just the site search widget; `/thank-you-for-placing-an-order-with-us/` is a static bank-details page with no form either. The original "may have lead-capture forms" was a static-analysis guess, and it was wrong — there is no lead-capture form anywhere on the live site to migrate. Decided not to add one now (it would be new functionality, not a live-site match — out of scope for this migration). If one gets built later, submissions go to email via Resend.
7. ~~Decide whether the bank-details page should be `noindex`.~~ **Done 2026-07-30** — Michael wants it link-only. Patched `seo.noIndex: true` directly on the Sanity document (`page-c5c7607b28b806d13f967b11`, targeted single-document patch via `sanity documents create --replace`, not a dataset-wide reimport) rather than in code, since `seo.noIndex` is exactly the field `buildMetadata()` and the sitemap queries already key off. Verified locally: page renders `<meta name="robots" content="noindex, follow"/>` and is excluded from `sitemap.xml`'s query; still resolves normally by direct URL.

**After cutover:**

8. Move `uploads` to Vercel Blob or R2 and set `MEDIA_ORIGIN` **before** cancelling WordPress hosting.
9. T+60: consolidate the thin tag archives.

**Baseline captured 2026-08-04** (Session 2d, GSC → Performance → last 3 months): **6.9k total clicks, 297k total impressions.** Indexing → Pages: **113 indexed, 41 not indexed.** This is the pre-migration number to compare post-cutover traffic against during the 90-day monitoring window — a dip in weeks 1-2 is normal, a sustained drop below this baseline past week 4 is not. The 41 not-indexed is worth a glance now (could be old attachment URLs, thin tag pages, or something worth fixing before cutover) but isn't itself a blocker. Michael has the Pages-tab CSV export saved separately.

## 7. GitHub + Vercel deploy (2026-07-30)

Pushed to `github.com/mceemichael/Ideal-Roofing-System` (private) and deployed
via the Vercel CLI (no `gh` CLI available in this environment, so repo
creation was done by Michael through the website; everything else driven from
the terminal). Live preview: `https://ideal-roofing-vercel.vercel.app`.

**Two real bugs found and fixed during this deploy, not before:**

1. **Preview-noindex blind spot.** Vercel auto-promotes a brand-new project's
   *first* deployment to `VERCEL_ENV=production` even with no custom domain
   attached — both existing noindex guards (`robots.ts`, `next.config.mjs`
   headers) keyed off `VERCEL_ENV === 'preview'` alone, so neither fired and
   the `.vercel.app` URL was briefly crawlable with a real `Allow: /` robots.txt.
   Fixed by adding a **request-host check** (`middleware.ts`'s
   `isNonCanonicalHost()`, and the same check in `robots.ts` via
   `next/headers`) that noindexes any request whose hostname isn't the real
   `NEXT_PUBLIC_SITE_URL` domain — robust against this Vercel quirk, ordinary
   preview deploys, and stays permanently correct after DNS cutover (the real
   domain will match; the `.vercel.app` alias never will). Verified: fixed
   deploy shows `Disallow: /` and `X-Robots-Tag: noindex, nofollow` on the
   `.vercel.app` URL.
2. **`POSTS_PER_PAGE` was wrong (14, should be 10).** `npm run verify` failed
   on `/blogs-and-projects/page/4/` (404). Checked the live site directly:
   it has exactly 4 pagination pages for 39 posts (10+10+10+9), confirming
   WordPress's default of 10/page — the original build's "WordPress was
   showing 14" comment was a guess made without live access, and wrong. Fixed
   in `src/lib/site.ts`.
3. Also fixed: `/author/[slug]` lookup was case-sensitive (`slug.current ==
   $slug`), 404ing on `/author/ruth/` when the imported slug was `Ruth`.
   WordPress's author-archive rewrite is case-insensitive (both case variants
   200 on live), so `authorBySlugQuery` now matches via `lower(slug.current)
   == lower($slug)`.

After those fixes: `npm run verify -- https://ideal-roofing-vercel.vercel.app`
→ **110/110, GATE: PASSED.**

**Content-diff check (`--diff`) has two known false positives, both
investigated and explained, neither is a real gap:**

- `/blogs-and-projects/` reads as -42% "loss" because the **live site's own
  Elementor pagination has a bug** — it duplicates some posts across pages
  (verified: "Roofing Sheets Budgets for a 3-bedroom Bungalow in 2024" appears
  on both live page 1 and live page 3). Our version shows each post exactly
  once, which is more correct, not less complete.
- The 4 remaining flagged pages (including both top-priority pricelist pages)
  were missing a **Trustindex Google-reviews widget** the live site embeds on
  individual posts only (not pages) — genuine third-party review content, not
  stored in the WordPress export since it's plugin-rendered. Michael provided
  his Trustindex embed snippet; it's now wired in via `TrustindexReviews.tsx`
  (`next/script`, `strategy="afterInteractive"`) inserted into the post
  template in `src/app/[slug]/page.tsx`, right after `PortableBody` and before
  the tags list — matching the live page's exact placement. Confirmed the
  script tag renders in the deployed HTML. The `--diff` script still reports
  these as "loss" because it only fetches plain HTML — it can't execute the
  widget's JS to see the reviews it injects, the same class of limitation as
  the pagination false-positive above, not a sign anything is still missing.

**Not yet done:** Vercel's GitHub integration (auto-deploy on push) failed to
connect ("Failed to connect mceemichael/Ideal-Roofing-System... make sure you
have access") — likely needs the Vercel GitHub App authorized for this
specific private repo via the Vercel dashboard. Not blocking; deploys work
fine via `npx vercel --prod` in the meantime.

## 8. Live-site copy sync (2026-07-30)

Michael's WordPress site has been edited since this repo's homepage copy was
originally written up, and he asked for a gentle re-crawl and sync of the
hardcoded site-wide copy (business description, tagline, footer, nav labels,
homepage sections — explicitly NOT post/page bodies, which now come from the
real Session 4 import instead). Fetched the live homepage and diffed by hand
against `src/app/page.tsx`, `src/lib/site.ts` and `src/components/Footer.tsx`.
Updated: pricelist nav labels (added the live " | July 2026" / " | 2026" date
stamps), the footer's social-icon order (WhatsApp now before Pinterest, matching
live), and several homepage blocks that had been reworded on the live site since
this repo's copy was written — the three service blurbs, four of the six
"why choose us" reason bodies, the About Company paragraph, and two section
headings ("Six Reasons For People Choosing Us", "OVER 100 "5 STARS" REVIEWS AND
CLIMBING", both matched verbatim including live's own casing/pluralisation).

One reason body ("Quality Material") was matched **including a live typo**
("intergrity" instead of "integrity") — deliberately, since the instruction was
to match current live text exactly; that's hardcoded homepage copy, not CMS
content, so there's nowhere else to fix it except here if Michael wants it
corrected later.

**Found but deliberately NOT built** (out of scope — this was a text-sync pass,
not a feature build): the live homepage now has a "People Say The Nicest
Things" testimonials section (3 named staff members with star icons and
quotes) that doesn't exist anywhere in this codebase. Worth a explicit decision
from Michael before building — it's staff testimonials, not customer reviews,
so it doesn't trigger the self-serving-review-markup concern in `seo.md`, but
it is new UI, not a copy fix.

**Also noticed, not acted on:** the live homepage itself shows two different
review counts on one page load — "4.9 based on 151 reviews" in the header,
"4.9 based on 157 reviews" in the footer (likely a caching/refresh lag in
whatever review-count widget/plugin they use). `site.reviewCount` is hardcoded
to 157 and used consistently everywhere on the rebuilt site, which is more
internally consistent than the live site currently is — left as-is rather than
picking one of two contradictory live numbers.

---

## 9. Visual-fidelity fixes (2026-07-30)

Michael spotted four real design mismatches by eyeballing the deployed preview
against the live site. All four traced back to real, fixable causes — not
subjective taste calls:

- **Site font was wrong.** This build was loading Google's Inter font via
  `next/font/google` in `layout.tsx`. The live site (Neve theme default)
  never loads a web font at all — it's plain `Arial, Helvetica, sans-serif`
  at a 15px root size. Removed Inter entirely; `tailwind.config.ts`'s
  `fontFamily.sans` and `globals.css`'s `body` rule now match live exactly.
  This is why headers "looked wrong" — different font, different metrics.
- **Missing "Trusted By Over 2000+ Engineers..." ticker.** Not a slider —
  it's a CSS `@keyframes` scrolling marquee (single copy of text, off-screen
  right to off-screen left, restart), and it's a **global header element**
  (confirmed present on 5/6 live pages checked), not homepage-specific. The
  previous build had it as static homepage-only hero text. Rebuilt as real
  CSS marquee in `globals.css` + `Header.tsx`, removed the now-duplicate
  static line from `page.tsx`.
- **`#004aad` background missing.** That's Elementor's own "secondary" global
  colour on the live site (distinct from `#2f5aae`, the `theme-color`/`brand`
  token) — used specifically as the marquee's background. Added as
  `secondary` in `tailwind.config.ts` rather than changing `brand`.
- **Homepage video missing.** Live has a self-hosted `<video>` (not YouTube —
  there's an empty/unconfigured Elementor YouTube widget alongside it that's
  a red herring) as the literal first thing in `<main>`, right after the
  header, before the "Latest posts" grid. Added to `page.tsx` with identical
  attributes (`autoplay controls playsinline controlslist="nodownload"
  preload="none"`, no `muted` — matching live exactly even though most
  browsers will silently block the autoplay without it, same as live).
  Path is `/wp-content/uploads/2026/04/2026-04-04-201337262.mp4`, proxied
  through the existing `MEDIA_ORIGIN` rewrite like every other legacy asset.

Note: confirmed there is no "Nigeria's Leading Roofing Company" hero
heading/description/CTA section anywhere on the live site — that whole block
in `page.tsx` was an original addition, not a live-site match. Michael didn't
ask for it to be removed, so it's left in place (now below the video rather
than above it, to keep the video in its correct live position).

Verified: `npm run build` passes, `npm run verify` still 110/110 after
redeploy.

## 10. Site-wide theme correction (2026-07-30) — read this one carefully

What started as "the header background is the wrong blue" turned into the
single biggest correctness finding in this whole migration: **the live site
is a dark-blue-background, white-text theme, and this entire build was done
the opposite way** (white backgrounds, dark `ink` text) from the very first
session, because it was authored via static HTML/CSS analysis without ever
loading the site in a real browser (see §5 — `npm install` never ran, nothing
was ever visually verified).

The root cause, found by reading the live CSS: `<body class="... elementor-kit-8 ...">`
carries a rule — `.elementor-kit-8{background-color:#004aad;color:#fff;...}` —
that is Elementor's *global Kit* styling, applied via a class selector, which
beats the theme's own `body{background-color:var(--nv-site-bg)}` (`#ffffff`)
rule on CSS specificity alone. That single fact means the dark canvas isn't a
homepage quirk — it's the base of every single page on the site. Confirmed
with actual screenshots (via the `claude-in-chrome` browser tool), not just
CSS reading: homepage top-to-bottom, and a full pricelist post including its
price table, both fully dark-blue-and-white on live.

**What changed:**

- `globals.css` / `layout.tsx`: `<body>` is now `bg-secondary` (`#004aad`,
  added as a real Tailwind token, distinct from `brand` `#2f5aae`) with white
  default text. **This was almost missed** — `layout.tsx`'s `<body
  className="bg-white ... text-ink">` was overriding the `globals.css` body
  rule via Tailwind class specificity beating a plain element selector. Both
  had to change together or the fix silently wouldn't apply.
- `Header.tsx` / `Footer.tsx`: no longer a white top bar / dark navy footer —
  both now blend into the same continuous page background, matching live.
  Nav text, mobile flyout, dropdown submenu all switched to white/light
  variants.
- `PortableBody.tsx` — **the actual content renderer for every post and page
  on the site** — every heading, paragraph, list, blockquote, callout and
  link switched from `text-ink`/`text-ink-muted` to white/white-opacity
  variants. The `priceTable` block specifically was redesigned to match the
  live table's exact look: lighter-blue header row, dark-blue data cells with
  white text, and a **white "label" cell in the first column of every row**
  — confirmed pixel-for-pixel against a live screenshot, not guessed.
- `page.tsx` (homepage), `PageHeader.tsx`, `Breadcrumbs.tsx`,
  `[slug]/page.tsx`, `author/[slug]/page.tsx`, `tag/[slug]/page.tsx`,
  `search/page.tsx`, `not-found.tsx`, `Pagination.tsx`, `Comments.tsx`,
  `CommentForm.tsx` — same treatment throughout.

**Deliberately left as white "islands"**, matching what live actually does:
`PostCard.tsx` (blog preview cards), the price table's first column, form
`<input>`/`<textarea>` fields (`SearchBox.tsx`, `CommentForm.tsx`), and the
self-contained tool widgets (`RoofAreaCalculator.tsx`, `LengthConverter.tsx`,
each already in their own white card). Sanity Studio (`/studio`) is
untouched — that's Sanity's own UI, not site theme.

**Verified, not assumed:** rebuilt, redeployed, re-ran `npm run verify`
(110/110, still passing) after this change, and used the browser tool to
screenshot both the homepage and a full pricelist page (including its price
table) side-by-side against the equivalent live pages.

**If something still looks wrong on a page type not explicitly listed
above** (there are ~85 files in `src/`; this pass covered every
high-traffic shared component and template, but not necessarily every
one-off), the pattern to apply is the same: replace `text-ink`/`bg-white`/
`bg-surface-soft`/`border-surface-border` with white/opacity equivalents,
*unless* the element is a deliberately-white island per the list above.

## 11. DNS is on Cloudflare, not a plain registrar (2026-08-04)

Discovered while prepping the cutover checklist: idealroofingsystem.com's DNS is managed through Cloudflare, and every record (`A` and the `www` `CNAME`) is currently proxied (orange cloud). `MIGRATION-PLAN.md` and `START-HERE.md` were originally written assuming a plain registrar DNS panel — both have been corrected.

Two consequences:

- **No week-ahead TTL drop needed.** Proxied Cloudflare records don't carry a manually-set TTL; Cloudflare's own network already makes changes take effect near-instantly. The old "drop TTL to 300s a week early" step is gone from both docs — there's no waiting period before T-0 anymore.
- **At T-0, the records must be switched to "DNS only" (grey cloud) when pointed at Vercel**, not left proxied. Vercel needs to see real traffic directly to issue its own SSL cert and verify the domain; leaving Cloudflare's proxy in front of Vercel adds a layer neither the original plan nor Vercel's setup flow accounts for. Decided (2026-08-04): go DNS-only under Vercel rather than keep Cloudflare proxying in front of it — simpler, and Vercel's edge already provides the CDN/SSL Cloudflare was giving WordPress, so nothing is lost by turning the proxy off for just these two records.

Rollback is correspondingly simpler than the original plan assumed too: revert the `A`/`CNAME` values in Cloudflare and re-enable proxying if it was on before. Still minutes, not the "~10 minutes at TTL 300s" framing the docs used to have — that framing no longer applies since there's no registrar-level TTL involved on the way in either.

**Not yet checked:** whether Cloudflare has any Page Rules, Firewall Rules, Redirect Rules, or Workers configured for the WordPress origin. These are worth a quick look in the Cloudflare dashboard before cutover — though since we're going DNS-only, Cloudflare's proxy-dependent rules (Page Rules, Firewall Rules, Workers, caching) won't apply to this domain's traffic once the switch happens regardless, so this is a "nice to check, not blocking" item rather than a real risk.

## 12. Cutover executed (2026-08-04)

**Status: LIVE.** DNS was switched in Cloudflare (grey-cloud, DNS-only, pointing `A`/`CNAME` at Vercel) around 05:29 UTC. Verified after cutover: `https://idealroofingsystem.com/` → 200, `https://www.idealroofingsystem.com/` → 301 → apex, `npm run verify -- https://idealroofingsystem.com` → **110/110, GATE: PASSED**, `robots.txt` correctly `Allow: /` with no `X-Robots-Tag: noindex` on the real domain.

**There was a ~1 hour gap between the DNS flip and the site actually being reachable, worth remembering if this happens again on a future domain move:**

- Immediately after adding the domain in Vercel, `vercel certs ls` showed no certificate and both `curl` and Vercel's own edge refused/timed-out connections on port 443 — DNS was already correct and globally propagated (confirmed via Google's DNS-over-HTTPS, sourced from Cloudflare's own authoritative servers) the whole time, so the delay was purely Vercel-side cert issuance + edge propagation, not a DNS problem.
- The dashboard's Domains page showed a "DNS Change Recommended" badge during this — that was a red herring. It's Vercel suggesting a newer CNAME-based record (`b86973c521ed6839.vercel-dns-017.com`) over the legacy `76.76.21.21` A record, purely an IP-range-expansion notice. It explicitly states the legacy record "will continue to work" and was unrelated to the downtime.
- Michael independently found that switching WiFi networks made the site load when it was still failing from this machine and from an external fetch — likely his original network's router/ISP had cached the pre-cutover DNS answer or a failed connection attempt. Once Vercel's cert/edge config finished propagating (~55-60 min after the domain was added), it started working everywhere, WiFi switch or not.
- Net takeaway: once DNS is confirmed correct and a cert shows in `vercel certs ls`, if the site still isn't loading, the fix is usually just waiting a bit longer for edge propagation — not touching DNS again.

## 13. Post-cutover outage: `/wp-content/uploads/*` returning 508 (2026-08-04)

**Found:** hours after cutover, Michael reported the homepage video wasn't showing. Turned out to be site-wide, not video-specific: every legacy image and the video under `/wp-content/uploads/*` was returning `HTTP 508 Loop Detected`.

**Root cause:** `next.config.mjs`'s `MEDIA_ORIGIN` fallback was `process.env.MEDIA_ORIGIN || 'https://idealroofingsystem.com'`. Before cutover that was safe — the domain pointed at WordPress, so "proxy uploads to idealroofingsystem.com" meant "fetch from WordPress." Once DNS pointed the domain at this Next.js app instead, the same rewrite made the app proxy `/wp-content/uploads/*` requests to itself, infinitely. `MEDIA_ORIGIN` had never actually been set as a real env var in Vercel — the risk called out in the code comment and in `HANDOFF.md` §6 item 8 (**"Move uploads to Vercel Blob or R2 and set `MEDIA_ORIGIN` before cancelling WordPress hosting"**) had been correctly identified in advance but not yet acted on, and cutover happened before it was.

**Fixed, permanently, same session:**

1. Enumerated every legacy media path actually in use — 153 unique `legacyUrl`s from a live Sanity export, plus paths hardcoded in `src/` (the homepage video, logo) — 160 total (one had a stray `#t=0` media-fragment suffix from the video's `<source>` tag, cleaned before use).
2. Since the domain no longer reaches WordPress, fetched every file **directly from the WordPress origin by IP** (`147.124.214.7`, from Michael's cPanel welcome email) **with an explicit `Host: idealroofingsystem.com` header** — this is what let the shared-hosting box route the request to the right virtual host without relying on DNS at all. 157/160 succeeded.
3. The 3 failures: one was a regex artifact from extraction (not a real URL), and two (`img_2073.jpg`, `roofing-service-residential-300x118.jpg`, both from unrelated 2022 blog posts) 404 directly on WordPress itself too — pre-existing dead references, not something this migration broke. Not fixed; not urgent.
4. Created a **public Vercel Blob store** (`ideal-roofing-uploads`), uploaded all 157 files preserving the exact `wp-content/uploads/...` path structure, via `@vercel/blob`'s `put()` (installed with `--no-save`, not a project dependency — one-off migration script, deleted after use).
5. Set `MEDIA_ORIGIN` as a real Vercel **production** env var (and in `.env.local` for local dev) pointing at the Blob store's public base URL. No code changes were needed — this is exactly the mechanism `next.config.mjs`'s rewrite was already built for.
6. Redeployed (`vercel --prod`). Verified: video and a sample image both 200 with correct content-type, full video byte count matches WordPress's `Content-Length` exactly, `npm run verify` still **110/110, GATE: PASSED**.

**This also completes HANDOFF §6 item 8** ("move uploads before cancelling WordPress hosting") — done now, ahead of schedule, under pressure rather than as a calm planned step. WordPress hosting can be cancelled once Michael is comfortable, without re-doing this.

**One tooling note for next time:** this session's sandbox could reach ports 80/443 but not FTP (21) or cPanel (2082/2083) even with raw TCP working — routing files through the WordPress origin via IP + `Host` header on port 443 sidestepped that cleanly and is worth reaching for first if this happens again on another migration.

**A second, sneakier bug surfaced right after fixing the first one: the CDN had cached the broken response.** Michael reported the video "still not showing" *after* the `MEDIA_ORIGIN` fix and redeploy above. Every check from this session's own tooling (`curl`, `WebFetch`) showed the fix working — 200s, correct file sizes, proper Range support. The disconnect: those tools egress from a different network path than Michael's real browser. The actual bug: during the outage, at least one Vercel edge node (`X-Vercel-Id` region `cpt1`, likely serving Michael's part of the world) cached the literal error body **`"Infinite loop detected... INFINITE_LOOP_DETECTED..."`** with an `HTTP 200` status and `Cache-Control: public, max-age=2592000` (30 days) — so it looked like a normal successful cached response to the CDN and wouldn't naturally revalidate for a month. Confirmed by inspecting the actual bytes served (`performance.getEntriesByType('resource')` in a real Chrome tab showed `encodedBodySize: 112` where the real file is 40,054 bytes) rather than trusting a `curl` check from a different vantage point.

**Fixed with `vercel cache purge --yes` (both CDN and Data cache) plus `vercel alias set <deployment> <domain>`** to re-point both `idealroofingsystem.com` and `www` at the current deployment — the purge alone didn't clear this specific edge's entry even after three attempts and several minutes; re-aliasing forced the binding (and its cache) to rebuild. Verified fixed via a real Chrome tab with `fetch(url, {cache: 'reload'})` (bypasses the browser's *own* local cache while still hitting the real network/CDN, unlike `no-store` which proves nothing about CDN state, or a plain cache-respecting request which can't distinguish "CDN is fine" from "your own browser cached the old bad response during testing" — both looked identical from inside the same tab and cost real time to tell apart).

**Lesson for next time a mid-outage fix doesn't seem to take:** don't trust `curl`/`WebFetch` alone to confirm a live-site fix if the report is region-specific — check via a real browser (ideally the reporter's own network path) before concluding a deploy fix didn't work. And be aware testing itself can poison your own test browser's local cache with the bad response, making a *now-actually-fixed* origin look broken in your own follow-up checks — use `{cache: 'reload'}` in `fetch()` to tell the two apart.

**Purge + re-alias fixed it for Michael's network, but the video was still broken on a second device — different regional edges had cached their own independent bad copies, and purge doesn't reliably reach every one of them.** Rather than chase individual edges (unknown how many, no way to test most of them directly), gave the video and poster fresh URLs no edge had ever cached: `vercel blob copy` duplicated the same file content to `2026-04-04-201337262-v2.mp4` / `919908-768x639-v2.jpg` in the same Blob store, `src/app/page.tsx` now references the `-v2` paths, redeployed. This is guaranteed clean everywhere immediately — no propagation wait, no per-edge uncertainty. The original (non-`-v2`) paths are untouched and still resolve correctly (verified) for anyone with an old hotlink or bookmark; only the homepage's own reference moved. `npm run verify` still 110/110 after.

**If any other legacy asset ever shows this same symptom** (works from this session's tools, doesn't work for the actual visitor reporting it) — same playbook: confirm via a real browser on the affected network path first, try purge + re-alias, and if that doesn't clear it within a few minutes, `vercel blob copy` to a versioned path and repoint the one reference is the reliable fallback that doesn't depend on CDN propagation behaving.

## 14. A third bug, self-inflicted, and a browser-automation dead end (2026-08-04, same day)

After §13/§14's fixes, Michael reported the video still didn't play. Two more real findings:

**Bug 3 — Range requests aren't cache-key-differentiated at Vercel's edge for the `/wp-content/uploads/` rewrite.** While diagnosing, a manual `curl -H "Range: bytes=<near-end>"` against the `-v2` video got cached by the edge and was then served back for *every* subsequent request to that URL — Range or not, from any client — because the cache doesn't vary by `Range` header. Confirmed by testing multiple different Range values and a no-Range request all returning the identical wrong 100-byte slice. This is exactly the mechanism behind "shows poster, video never plays, no error" — a `<video>` element's own metadata-probing Range request could poison the cache for the next visitor, with or without anyone testing anything. Not a one-time fluke of the outage; a structural property of proxying Range-heavy content through this rewrite with a long `Cache-Control` max-age.

**Fix:** the video `<source>` in `src/app/page.tsx` now points **directly at the Vercel Blob URL** (`https://fdrdrwf4bhxxjwaq.public.blob.vercel-storage.com/wp-content/...`) instead of through the `/wp-content/uploads/` rewrite — confirmed Blob's own serving handles Range requests correctly with no cross-contamination (tested repeatedly: a targeted end-of-file Range request followed by a plain GET still returned the full correct file). The poster image stays on the rewrite since plain `<img>` loads don't send Range requests and aren't affected. **If this ever needs generalizing** (another video, or if images start showing the same symptom): same move — read `MEDIA_ORIGIN` directly in the server component and reference it for the `src`, rather than going through the rewrite, for anything a browser might issue Range requests against.

**Dead end, worth not repeating:** after that fix, still couldn't confirm actual playback via the `claude-in-chrome` browser tool — the `<video>` element stayed stuck at `readyState: 0` indefinitely. Proved this was a tooling limitation, not a real bug, by loading a totally unrelated, well-known external test video (MDN's `flower.mp4`) in the same tab — it got stuck identically. Automated/background browser tabs in this environment do not reliably load native `<video>`/`<audio>` resources regardless of source; `fetch()` to the same URLs works fine and is a reliable way to verify byte-level correctness, but **actual playback in this specific browser automation tool cannot be trusted as a signal, positive or negative.** Real verification of "does the video actually play" has to come from the person reporting it, on their own device.

## 15. WhatsApp button: page-aware pre-filled messages (2026-08-04)

Michael noticed WhatsApp chats from the live site used to arrive with page-specific pre-filled text (e.g. "What is the discounted price of aluminium roofing Sheet") and asked for that back — the rebuild's `WhatsAppFloat` was a plain static link with no message at all.

Traced the real mechanism on WordPress rather than guessing: the "Click to Chat for WhatsApp" plugin (by HoliThemes), config visible in each page's HTML as `ht_ctc_chat_var.pre_filled`. Fetched every post/page directly from the WordPress origin (IP + `Host` header, same technique as §13) and read off the actual configured message per page. Default across most pages: **"Hi, I got this number from your website"**. 15 high-intent product/budget pages had a hand-written override (e.g. aluminium pricelist → "Hello, how I need the discounted price of aluminium sheets"). Full list is in `src/lib/whatsapp.ts`.

**Implementation:** `WhatsAppFloat` became a client component using `usePathname()` to pick the right message and build a `https://wa.me/<number>?text=<encoded>` link. Deliberately *not* done via `headers()` in the root layout (the obvious-looking alternative) — this project prerenders every route (`generateStaticParams`/`revalidate`, confirmed via `npm run build`'s route table: every route showed `○`/`●`, none `ƒ`), and `headers()` is a dynamic API that would force the entire site to server-render on every request. `usePathname()` in a client component doesn't have that cost — the page still statically generates; only this one small component needs the current path, and it gets it for free from Next's router context even during the initial server render. Verified after deploy: `npm run build`'s route table is unchanged (no route flipped from static to dynamic), and `npm run verify` still 110/110.

The footer's separate WhatsApp social icon (`site.social.whatsapp`, a `wa.me/message/...` short link) is a different thing on both the old and new site — untouched.

**If a page's message ever needs to change or a new one added:** edit the `CUSTOM_MESSAGES` map in `src/lib/whatsapp.ts` directly; no need to touch WordPress or re-run any migration script.

## 16. PVC rain gutter page rebuild + a real image-rendering bug fix (2026-08-06)

Michael asked for `/price-of-pvc-rain-gutter-water-collector/` to be rebuilt: match a new pricelist from `Rain_Gutter Pricelist.docx`, add new product photos from his `Ideal Photos/Water Collector` folder as a visual guide next to the prices, add a real article on why Nigerians use PVC gutters, and optimise for search + AI answer engines. Done entirely as a live content patch (no URL/slug change), via `sanity exec --with-user-token` scripts (uploaded, used, then deleted — one-off, not kept in `scripts/`).

**What changed on the page:**
- New `priceTable` (13 rows) replacing the old messy Elementor-import bullet list, sourced from the docx (prices moved on most parts vs. the old body — e.g. downpipe ₦4,550→₦4,400, gutter joint ₦1,000→₦750, wire ₦1,000→₦1,500 — read as real repricing, not a typo).
- 13 new photos uploaded as real Sanity image assets (not `legacyUrl`) and placed right after the price table, each captioned with the exact same name used in the table row, so a customer can visually match a part to its price. One of the 13 (`Elbow.png`) only appeared in Michael's OneDrive folder mid-session — the folder is live-synced, worth remembering if a future task reads from it.
- A genuine "Why Nigerian Homeowners Choose PVC Rain Gutters" section and an FAQ section, both new content — not filler, grounded in real reasons (corrosion resistance in humid/coastal climate, cost vs. metal, ease of install, compatibility with both roof types already sold).
- Existing testimonials, both "Also Read" internal links, and the external citation link were all kept, not dropped.

**A real, previously-latent bug found and fixed: `sanity/image.ts`'s `imageSrc()`.** It called `urlForImage(source)` — passing the whole `legacyImage` wrapper object — instead of `urlForImage(source.asset)`. This works by accident for `legacyUrl`-only entries (falls through to a different branch) but throws `Malformed asset _ref ''` for any entry with a real Sanity-uploaded asset, because `@sanity/image-url` needs `source.asset._ref` one level shallower than what a `legacyImage` object actually has at that depth. It had never been caught because almost no content had a real (non-`legacyUrl`) asset attached to something that actually got rendered through `.url()` at build time — this page's 13 new images were the first time that happened at scale. Fixed by passing `source.asset` instead of `source`. **If a future page ever throws `Malformed asset _ref ''` during `npm run build`, this is almost certainly the same bug resurfacing somewhere it wasn't fully fixed.**

**New: `faq` field + FAQPage structured data.** `faqSchema()` existed in `src/lib/schema.ts` since the migration but was never wired to anything. Added a `faq` array field to `sanity/schemas/post.ts` (question/answer pairs), added it to `postBySlugQuery`, and wired `faqSchema(post.faq)` into the existing `graph()` call in `src/app/[slug]/page.tsx` — one connected `@graph`, per `seo.md`'s rule, not a separate island. The FAQ content is duplicated deliberately: once as visible `h3`/paragraph body content (what Google's guidelines say the markup should mirror), once in the structured `faq` field for the JSON-LD. Any post can now carry an FAQ section the same way; it's optional and does nothing if left empty.

Verified: `npm run typecheck`, `npm run build` (141/141 static), `npm run verify -- https://idealroofingsystem.com` → **110/110, GATE: PASSED**, and the live page fetched directly to confirm the price table, all 13 images (real `cdn.sanity.io` URLs, not `legacyUrl`), the article, and `FAQPage` JSON-LD are actually present in the served HTML — not just assumed from the build succeeding.

## 16.5 `/pricelist/` hub page rebuild (2026-08-06)

Michael asked for the `/pricelist/` hub page to look "cleaner and classic," reusing images already live on the site. Before: a thin, WordPress-import-shaped page — the same 4 links duplicated twice (once as `h3` headings, once as a bullet list), a bare Google Maps iframe dropped mid-list with no heading or context, and a dangling YouTube link at the very end with no lead-in text. `seo.description` still said "2024."

**Rebuilt as a real material-comparison page**, same `legacyImage`/`priceTable`/`htmlEmbed` Portable Text vocabulary as everything else — no new schema or component work needed this time:
- One clearly-headed section per material (Aluminium, Stone-Coated/Gerard, Alu-Zinc, PVC Rain Gutter), each with a thumbnail reused directly from that post's own `featuredImage` (same `legacyUrl`/Sanity-asset value, copied over — not new uploads), a one-line description, a starting price pulled from that post's own price table, and a link to the full pricelist.
- Surfaced an existing post that had no path to it anywhere in the site's own navigation: `/aluminium-roofing-sheets-types-grades-price/` (found via a Sanity query for posts with "price" in the title), linked as a buying guide.
- Added a "Related Tools" section cross-linking the roof area calculator and the aluminium colour chart — two of the site's other top pages (per §1's inventory) that had no link from this hub either.
- Kept the Maps iframe and the YouTube link — both real, useful content — but gave them an actual "Visit Our Showroom" heading and a sentence of context instead of floating with nothing around them.

**One thing worth knowing if you rebuild another page like this in the same session:** `npm run build` run back-to-back without clearing `.next/cache` will silently serve the *previous* build's Sanity fetch-cache data even after a fresh content patch, because Next's on-disk Data Cache persists across `next build` invocations within the same working directory (only the `revalidate` window or an explicit `revalidateTag` call busts it, not a fresh `npm run build`). Caught this because the local render was missing the just-patched content. `rm -rf .next` before rebuilding forces a true refetch. This does not affect Vercel deploys (each one builds in a clean environment), but it will fool a local `npm run build && npm run verify` sanity check into passing against stale content if you don't clear the cache first.

Verified: `npm run build` (clean `.next`), `npm run verify` 110/110 locally and again against the live domain after deploy, and the live HTML fetched directly to confirm all 4 material images, the new headings, and the two new cross-links are actually present.

## 16.6 Sanity → Vercel revalidate webhook was never actually wired up (2026-08-08)

Michael edited a post's title and added a featured image in Studio, hit publish, and neither change showed up on the homepage. Checked the published document directly in Sanity — his edits were correctly saved and published, no draft stuck unpublished. So it wasn't an editing mistake on his end.

**Root cause: `src/app/api/revalidate/route.ts` (the on-demand revalidation endpoint) has existed since the migration, with a comment saying exactly how to wire it up in Sanity's dashboard — but that setup step was never actually done.** `SANITY_REVALIDATE_SECRET` wasn't set in Vercel (`vercel env ls` showed no such variable), and `npx sanity hook list` returned zero hooks. Every route falls back to its `revalidate: 3600` (1h) static setting, so edits were always going to show up *eventually* — just up to an hour later, which reads as "broken" to someone checking right after publishing.

**Fixed properly, not just documented:**
1. Generated a real secret, added as `SANITY_REVALIDATE_SECRET` in Vercel (`vercel env add ... production`), then redeployed — Vercel serverless functions only pick up a newly-added env var on the *next* deployment, not retroactively.
2. Created the actual webhook via Sanity's Management HTTP API (`POST /v2021-10-04/hooks/projects/{id}`, called through `getCliClient()` inside `sanity exec --with-user-token` — the `sanity hook create` CLI command doesn't create anything itself, it just opens the sanity.io/manage web form in a browser, which isn't usable headlessly). Body shape verified against Sanity's own docs before sending, not guessed: trigger events live under `rule.on`, not a top-level `trigger` field.
3. **Caught a real bug in the process**, worth remembering for any future webhook: the webhook URL `https://idealroofingsystem.com/api/revalidate` 308-redirects to `/api/revalidate/` because of this site's site-wide `trailingSlash: true`. `curl -L` follows that fine, but there's no guarantee Sanity's webhook dispatcher follows redirects on a POST — silently getting 308s back forever would look identical to a working webhook (200-looking logs would never even appear) while never actually revalidating anything. Fixed by pointing the webhook at the exact trailing-slash URL directly (`PATCH /hooks/{id}` with the corrected `url`), so no redirect is ever involved.
4. Verified for real, not just assumed: triggered a genuine document mutation (harmless no-op patch, same title re-set) and confirmed via `npx sanity hook logs vercel-revalidate` that Sanity's own delivery log shows **Status: success, Result code: 200** — then fetched the live homepage and the affected post directly and confirmed the new title and new image are actually there.

**If this ever needs to be recreated or debugged:** `npx sanity hook list` / `npx sanity hook logs vercel-revalidate` from this repo (needs `--with-user-token` for anything beyond listing). The webhook secret only lives in Vercel's env vars and the webhook's own `headers` config — it isn't in git and isn't in this file.

## 16.7 Rank Math-style SEO scoring in Studio, and a route-group restructure (2026-08-08)

Michael's top priority is SEO, and his specific complaint was that Studio gave him none of Rank Math's feedback — no character counter on title/description, no way to see which pages need work without opening each one.

Built a full scoring system: `sanity/lib/seoScore.ts` runs a 10-check Rank Math-style checklist (title/description length against Rank Math's own 30-60 / 120-160 char thresholds, focus keyword in title/description/URL/first paragraph/a subheading, content length, image alt coverage) against whatever's currently typed, unsaved edits included. That one function feeds three UI surfaces: a live character-count bar on the `seo.title`/`seo.description` fields themselves (`SeoTitleInput`/`SeoDescriptionInput`, wrapping the default input via `renderDefault` rather than rebuilding it), a full "SEO Analysis" tab next to the normal editing form on every post/page (`SeoScorePanel`, a Studio document view), an "SEO: 80% Good" badge next to the Published/Draft status (`SeoScoreBadge`, a document badge), and a new "SEO Overview" item in Studio's top nav (`SeoOverviewTool`) listing all 47 posts/pages sorted worst-score-first — the thing Michael actually asked for by name ("so I know pages that are doing well and not").

**Found and fixed a real, separate bug while verifying this in a real browser** (not just a clean build — screenshots caught what a build never would): the site's own blue header, footer and WhatsApp button were bleeding into every Studio page. `src/app/studio/[[...tool]]/layout.tsx` had a comment claiming it "bypasses the header, footer and WhatsApp button," but a nested layout can only render *inside* its ancestors — it was still wrapped by the main site's root layout the whole time, and nobody had opened `/studio` in a real browser to notice (per §10's and earlier sections' repeated theme in this file). Fixed by moving the entire rest of the site into `src/app/(site)/` with its own root layout, leaving `src/app/studio/[[...tool]]/layout.tsx` as the sole, genuinely independent root layout for that branch — Next.js's documented pattern for multiple root layouts.

**That restructure broke `/robots.txt` (404) on the first attempt** — caught before it ever reached production, not after. Moving `robots.ts` into `(site)/` alongside everything else made Next 15 silently fail to register it as the special metadata route (confirmed via `next dev` logs: a request for `/robots.txt` compiled and served the `[slug]` catch-all instead, correctly returning its own 404 for an unmatched slug — the metadata file was never in the routing table at all). `sitemap.ts`, moved the same way, worked fine. The difference: `robots.ts` calls `headers()` (a dynamic API, needed for the non-canonical-host noindex check) and `sitemap.ts` doesn't — a dynamic metadata-route file one level into a route group appears to be a genuine Next 15.5 limitation, not a mistake in this code. **Fix: `robots.ts` stays at the true `src/app/` root**, outside `(site)/` — it doesn't render through any layout (it returns a config object, not JSX), so it doesn't need to be inside the route group's layout tree anyway. If a future `manifest.ts`/`opengraph-image.tsx`/similar dynamic metadata file ever needs adding, keep it at the true root too rather than assuming route groups are transparent to every file convention.

Verified thoroughly before *and* after deploying: full clean build, `npm run verify` 110/110 locally, then again against the live domain after `vercel --prod`, plus a direct curl of the live `/robots.txt` to confirm the real (not preview-blocked) `Allow: /` content is actually being served — this specific check mattered more than usual given what had just broken and been fixed locally.

## 17. Bing Webmaster Tools findings and fixes (2026-08-14)

Michael logged into Bing Webmaster Tools for the first time since cutover (its verification meta tag had been carried over from the old Rank Math config, but nobody had confirmed the account was actually verified and active there — separate from Google Search Console, which is what the [[ideal-roofing-gsc-baseline]] traffic numbers come from). It surfaced two "Recommendations," each with a downloaded CSV of affected URLs. Both are now fixed and deployed.

**Finding 1 — "Meta descriptions on many of your pages are too short" (21 URLs, Moderate).** Checked every URL live rather than trusting the CSV at face value:

- **12 of 21 were 404s, correctly.** All were WordPress image-attachment pages (auto-generated per-image URLs like `/price-of-aluminium-roofing-sheets-in-2026/metrocopo/`, or standalone ones like `/hip-roof/`) — confirmed against `wordpress-export.xml`, every one is `wp:post_type = attachment`, not real content. These were deliberately never migrated (see §1's inventory — attachment pages were never part of the 39/7/6/54/2 count) and Google/Bing themselves recommend not indexing them. Bing's report is just a stale pre-cutover crawl snapshot; these will drop out on their own as Bing recrawls. No action taken.
- **9 of 21 were real, live pages.** 2 already had adequate-length descriptions (Bing's flag on those looks stale too). 7 were genuinely short:
  - 5 tag archives + 1 author page were hitting the generic fallback template in `src/app/(site)/tag/[slug]/page.tsx` and `.../author/[slug]/page.tsx` ("Roofing articles tagged X from Ideal Roofing System.", 60-81 chars) — used whenever a tag/author has no custom `description`/`bio` set in Sanity. Since this fallback covers all 54 tag archives + 2 author pages, not just the 5 the CSV happened to include, the fix targets the template itself: now includes the live post count and more context (e.g. "5 articles tagged Aluminium — roofing prices, installation tips and buying guides from Ideal Roofing System, a Nigerian roofing company.", 138 chars). An explicit `tag.description`/`author.bio` in Sanity still overrides it.
  - `/aluminium-pricelist/` and `/stone-coated-pricelist/` are category archives (not simple pages), resolved through `[slug]/page.tsx`'s category branch — their short descriptions were real, hand-written `category.description` values imported from WordPress, not template output. Rewritten directly in Sanity via a one-off `sanity exec --with-user-token` script (deleted after use, per this project's established pattern).

Deployed via `vercel --prod`, confirmed live: `npm run verify` 110/110, and both the template output and the two category descriptions fetched directly from the live domain to confirm the new text is actually served. Committed as `861e19a`.

**Finding 2 — "Title too long" (8 URLs, High, >70 chars).** All 8 were real posts, several of them the site's top earners (`/price-of-aluminium-roofing-sheets-in-2026/`, `/price-of-stone-coated-gerard-in-lagos-2025/`). Root cause traced by comparing against the live WordPress origin directly (IP + `Host` header, same technique as §13): **individual WordPress posts and pages never carried a " | Ideal Roofing System" suffix in their `<title>` at all** — only tag/category/author archive titles did (`Aluminium Archives | Ideal Roofing System`), plus the homepage has it baked into its own literal title. This migration's `src/app/(site)/layout.tsx` had applied a **global `title.template`** appending the suffix to every single page uniformly — a deviation from the original site that was never caught because nobody had compared it against live WordPress output (same class of miss as §10's theme-colour bug and §16.7's Studio-layout bug).

**Fix:** removed the global `title.template` from `layout.tsx` (now a plain string, used only as the homepage/default title). `tag/[slug]/page.tsx`, `author/[slug]/page.tsx`, and the category branch of `[slug]/page.tsx` now build the " | Ideal Roofing System" suffix themselves, matching what WordPress actually served for those three archive types. This alone brought 7 of the 8 flagged posts under 70 characters with **no content changes at all** — they'd only ever been too long because of a suffix they should never have had. Committed as `2be67a8`.

The remaining 3 needed actual `seo.title` edits in Sanity (one because it was still >70 chars even without the suffix; two — the aluminium and stone-coated pricelist posts — at Michael's specific request to use his exact wording "Best Price of Stone coated (Gerard) In Nigeria - Aug 2026" / "Best Price of Aluminium Roofing Sheet In Nigeria - Aug 2026" rather than a paraphrase, which fit comfortably once the suffix was gone):

| Post | New `seo.title` |
|---|---|
| `price-of-stone-coated-gerard-in-lagos-2025` | Best Price of Stone coated (Gerard) In Nigeria - Aug 2026 |
| `price-of-aluminium-roofing-sheets-in-2026` | Best Price of Aluminium Roofing Sheet In Nigeria - Aug 2026 |
| `practical-roofing-budget-for-a-3-bedroom-using-aluminium-metrocopo` | Practical Roofing Budget for a 3-Bedroom (Aluminium Metrocopo) |

**A real gotcha hit while making these edits, worth remembering for any future `sanity exec --with-user-token` script:** patching the aluminium pricelist post by an `_id` obtained from a plain `*[_type == "post" && slug.current == $slug][0]` query silently wrote to a **draft** (`drafts.post-59425d795a1e70b5a5067960`), not the published document — `getCliClient()`'s default query has no perspective filter and returned the draft's `_id` preferentially over the published one. Because the live site's client uses `perspective: 'published'` (`sanity/client.ts`), the edit had zero effect on production despite the script reporting success. Caught by re-fetching the live page afterward and finding the old title still served — not by trusting the script's own "before/after" log. Fixed by comparing draft vs. published field-by-field (only the intended title differed, so nothing was at risk of being lost), patching the literal published `_id` directly, and deleting the now-redundant draft so Studio doesn't show Michael a phantom "unpublished changes" banner on that post. **If a future patch script needs the published document specifically, filter the query explicitly** (`&& !(_id in path("drafts.**"))`) rather than trusting the fetched `_id` to already be the published one.

Deployed via `vercel --prod`, confirmed live: `npm run verify` 110/110, and all 8 previously-flagged titles fetched directly and confirmed under 70 characters (57-68 chars), with the two Michael specified matching his wording exactly.

**Both fixes are now live; what's not yet resolved is Bing's own recrawl timing** — clearing the "Recommendations" list in Bing Webmaster Tools depends on Bing revisiting these URLs, which isn't something either side can push faster. Worth a glance next time Michael logs in, but not a blocker on anything.

## 18. Studio content pass on the pricelist pages (2026-08-15)

Content-only. No URL, schema-code, or design changes. Table prices were treated as the source of truth; contradictory captions/body/excerpts were rewritten to match.

Patched published documents only (`!(_id in path("drafts.**"))`), confirmed no drafts existed before or after:

- `post-59425d795a1e70b5a5067960` `/price-of-aluminium-roofing-sheets-in-2026/` — intro now ₦5,600–₦15,800 (was N5300), Gauge/Metrocopo spelling, Bozac-vs-Market clarified, empty "Client Feedback" heading removed, 4 FAQs + `faq` field, `updatedAt` 2026-08-15
- `post-59eb11600e00ed4328f0a521` `/price-of-stone-coated-gerard-in-lagos-2025/` — captions and body now match the table (Roman ₦5,200/₦5,800 not N6400; flatsheet ₦4,700/₦5,400 not N4800/N5600-per-piece), empty "Table of Contents" removed, 4 FAQs, slug unchanged
- `post-110b8d1136f31de42fb5413a` `/price-of-alu-zinc-in-lagos/` — title/seo "August 2026" (was March 2025), one price table (₦60,000 bundle / ~₦1,666 per metre), 3 FAQs, slug unchanged
- `post-24f23134b878fb87f840fd0e` `/aluminium-roofing-sheets-types-grades-price/` — three May 2026 tables removed; page now points at the aluminium pricelist
- `category-c8f15d234a5ce2cb9f036a36` `/aluminium-pricelist/` — description no longer carries the stale N5700/N6200/N7600 excerpt (that was the aluminium post's `excerpt`, also rewritten)

Webhook `vercel-revalidate` returned 200 for each mutation. Verified on the live domain: bylines show Updated 15/08/2026, `FAQPage` JSON-LD is present on the three money pages, types/grades has zero price tables.

`publishedAt` and slugs were not touched.

## 19. Offer schema, H1 swap, IndexNow (2026-08-15)

Code, not Studio. Four money slugs live in `MONEY_PAGE_SLUGS` (`src/lib/site.ts`):

`price-of-aluminium-roofing-sheets-in-2026`, `price-of-stone-coated-gerard-in-lagos-2025`, `price-of-pvc-rain-gutter-water-collector`, `price-of-alu-zinc-in-lagos`.

**Offer JSON-LD.** `offerListSchema()` walks that page's `priceTable` blocks, keeps only cells that parse as `₦`/`N` amounts (`parseNairaPrice` — gauges like `0.40mm` and counts like `15` are ignored), and emits one connected `ItemList` of `Offer` nodes (`priceCurrency: NGN`, `priceValidUntil` = last day of `updatedAt`'s month, `seller: { @id: organization }`). Wired into the existing `@graph` in `[slug]/page.tsx`. Not emitted on other posts, so a leftover blog table cannot become a product listing.

**H1 swap.** On those four routes the article title is the `<h1>` and the header brand name is a `<p>` with the same classes — visually unchanged. Everywhere else the header brand name stays the site's single H1.

**IndexNow.** `/api/revalidate` now pings `https://api.indexnow.org/indexnow` after a successful Sanity publish (content URL + home/blog index for posts). Failures are swallowed so a Bing outage cannot break revalidation. Uses the existing key file `public/abddba0e26de41cf843a84d559f0190d.txt` (added 2026-08-14). `INDEXNOW_KEY` env can override it if we rotate.

`npm run typecheck` and `npm run build` (141/141) passed locally. Built HTML for the four money pages has the article title as H1 and Offer ItemLists of 17 / 17 / 13 offers (aluminium / stone / PVC). Alu-zinc offers come from the current Sanity table (bundle ₦60,000 / ~₦1,666 per metre). Vercel is now connected to GitHub, so this ships on push to `main`.

## 20. Studio made usable for writing posts and SEO (2026-08-15)

Michael is not a developer. The Studio sidebar, field labels and insert menu were still written for the migration. Changes:

- Sidebar is now **Blog posts → Pages → Comments (waiting / approved) → categories/tags/authors → Site settings**. Vision is hidden.
- New posts open with today's date, last-updated, SEO noindex off, and author = Michael Chibuzo. Publish writes `updatedAt` so the sitemap stays honest.
- Imported WordPress slugs are locked. New posts can still Generate from the headline.
- Write / SEO / Publishing tabs. SEO leads with focus keyword, Google title, Google description; canonical and noindex are collapsed under Advanced.
- Insert menu: Image, YouTube, Price table, Tip first; calculator and raw HTML last.
- WordPress-only fields (legacy URL, WordPress ID) hide on new documents.
- SEO Analysis tab tells you how to fix each red check.

## 21. PageSpeed accessibility on the four money pages (2026-08-16)

Follow-up to the aluminium-page pass (`f27bf15`). Live Lighthouse still failed on the other pricelist URLs:

- Comment dates were `text-white/70` (12px, 4.03:1) on the comment card.
- Commenter name / date permalinks were smaller than the 24×24 tap target.
- Money-page title is now H1, but imported WordPress bodies still jumped (stone-coated H1→H3; alu-zinc H2→H4).

Fixes: comment dates to `text-white/85`, 24px tap targets on those two links, and `PortableBody` `fixHeadingOrder` on `MONEY_PAGE_SLUGS` only — pulls any skipped heading back to the next legal level, no Sanity patch. Figcaptions / table footnotes / tags heading also moved to `/85`.

Local Lighthouse accessibility after the build: **100** on all four money pages. `npm run build` 141/141.

**SEO 92 leftover (same session):** PageSpeed flagged the carousel WhatsApp button whose visible text was still “Click Here”. `aria-label` does not count for that audit. Generic slide CTAs (“Click Here” / “Order Here”) now render as **Chat on WhatsApp**. Local `link-text` score is 1.

## 22. If you're the next agent picking this up

Read `CLAUDE.md` first — it has the invariants. Then:

- The owner is non-technical. Explain, confirm before anything irreversible, and don't assume a command worked.
- He's following `START-HERE.md`. "Session 4" means a section in that file.
- The riskiest hour in the whole project is the DNS cutover (Session 7). Everything before it is reversible by deleting a folder.
- When choosing between "technically better" and "doesn't change a URL", choose the URL. Every time. There is a long list of things worth improving about this site, and the entire point of the plan is that none of them happen this month.
