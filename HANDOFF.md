# Handoff — decisions, state, and what's left

Written to transfer full context to whoever (or whatever) picks this up next. `CLAUDE.md` holds the rules that matter every session; this file holds the *reasoning*, which you only need when a decision looks odd.

**Status: pre-cutover.** WordPress is live and serving real traffic. Nothing here is public. No DNS has been touched.

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
6. **Confirm what forms exist on the live site.** `/pricelist/` and `/services/` may have lead-capture forms, and `/thank-you-for-placing-an-order-with-us/` implies something submits somewhere. Pages will render without them. That's lost conversion, not lost ranking, but it's lost revenue either way. Not yet built — needs a decision on where submissions go (email via Resend, or a form service).
7. ~~Decide whether the bank-details page should be `noindex`.~~ **Done 2026-07-30** — Michael wants it link-only. Patched `seo.noIndex: true` directly on the Sanity document (`page-c5c7607b28b806d13f967b11`, targeted single-document patch via `sanity documents create --replace`, not a dataset-wide reimport) rather than in code, since `seo.noIndex` is exactly the field `buildMetadata()` and the sitemap queries already key off. Verified locally: page renders `<meta name="robots" content="noindex, follow"/>` and is excluded from `sitemap.xml`'s query; still resolves normally by direct URL.

**After cutover:**

8. Move `uploads` to Vercel Blob or R2 and set `MEDIA_ORIGIN` **before** cancelling WordPress hosting.
9. T+60: consolidate the thin tag archives.

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

## 11. If you're the next agent picking this up

Read `CLAUDE.md` first — it has the invariants. Then:

- The owner is non-technical. Explain, confirm before anything irreversible, and don't assume a command worked.
- He's following `START-HERE.md`. "Session 4" means a section in that file.
- The riskiest hour in the whole project is the DNS cutover (Session 7). Everything before it is reversible by deleting a folder.
- When choosing between "technically better" and "doesn't change a URL", choose the URL. Every time. There is a long list of things worth improving about this site, and the entire point of the plan is that none of them happen this month.
