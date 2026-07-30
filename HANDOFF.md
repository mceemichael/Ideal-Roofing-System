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

## 7. If you're the next agent picking this up

Read `CLAUDE.md` first — it has the invariants. Then:

- The owner is non-technical. Explain, confirm before anything irreversible, and don't assume a command worked.
- He's following `START-HERE.md`. "Session 4" means a section in that file.
- The riskiest hour in the whole project is the DNS cutover (Session 7). Everything before it is reversible by deleting a folder.
- When choosing between "technically better" and "doesn't change a URL", choose the URL. Every time. There is a long list of things worth improving about this site, and the entire point of the plan is that none of them happen this month.
