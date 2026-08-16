# Ideal Roofing System — WordPress → Vercel migration

**idealroofingsystem.com** is live on Next.js 15 + Sanity + Vercel (cut over 2026-08-04). Goal remains **do not drop search rankings**. The site is a Nigerian roofing company; its pricelist pages are the commercial core and its main organic earners.

**Status: LIVE.** DNS is Cloudflare grey-cloud pointing at Vercel. WordPress no longer serves public traffic. Uploads are on Vercel Blob (`MEDIA_ORIGIN` is set). WordPress hosting can be cancelled when Michael is ready.

**Read `HANDOFF.md` when a decision looks odd** — it records what was chosen and why, plus what has and hasn't been verified. `MIGRATION-PLAN.md` is the phased plan and cutover runbook. `START-HERE.md` is the non-technical walkthrough the owner follows. Deliberately not auto-imported here: this file stays short so it gets followed.

## Who you're working with

The owner (Michael) is a **business owner, not a developer**. He built the original site in WordPress. Assume no prior knowledge of Node, git, DNS or React.

- Explain in plain language. Define jargon on first use.
- Do not assume a command that "obviously" works. Say what should appear on screen.
- Before anything irreversible (DNS, deleting files, force-push, dropping a Sanity dataset), say what it does and confirm.
- He is following `START-HERE.md`. If he says "Session 4", that's a section in that file.

## Commands

```bash
npm install
npm run dev        # site :3000, Sanity Studio :3000/studio
npm run build      # must pass before deploying
npm run typecheck  # tsc --noEmit
npm run migrate    # wordpress-export.xml -> sanity-import.ndjson
npx sanity dataset import sanity-import.ndjson production --replace
npm run verify -- <base-url>                       # every URL 200 or intended 301
node scripts/verify-urls.mjs --diff <old> <new>    # catches lost content/tables
```

`scripts/verify-urls.mjs` is the **live health gate**. It must stay green. Vercel deploys from GitHub on push to `main`.

## Non-negotiable invariants

Breaking any of these costs real search traffic. Do not change them without saying so explicitly.

1. **`trailingSlash: true` in `next.config.mjs`.** WordPress served `/slug/`. Turning this off points every indexed URL and backlink at a redirect, site-wide, on the same day.
2. **Slugs never change.** A slug is a URL is a ranking. If one genuinely must change, add a 301 to `src/lib/redirects.js` in the same edit.
3. **`publishedAt` / `updatedAt` are preserved, never regenerated.** They drive sitemap `lastmod`. If every date became today, Google reads it as a site-wide rewrite.
4. **The `verification` block in `src/app/(site)/layout.tsx` stays.** Those tags prove domain ownership to Google, Bing, Facebook, Pinterest. Removing one silently breaks a tool or ad account weeks later.
5. **`/wp-content/uploads/*` must keep resolving.** Rewrite in `next.config.mjs` points at `MEDIA_ORIGIN` (Vercel Blob). **Never let `MEDIA_ORIGIN` fall back to `https://idealroofingsystem.com`** — that is how the post-cutover 508 loop happened. Videos / anything that issues Range requests must use the Blob URL directly, not the rewrite.
6. **Never expose `SANITY_API_WRITE_TOKEN` client-side.** Server routes only.
7. **No global `title.template`.** WordPress never appended ` | Ideal Roofing System` to post/page titles — only tag/category/author archives do, and those three routes build the suffix themselves. Putting it back in the root layout makes the money pages fail Bing's 70-char check.
8. **H1 on the four money pricelist pages is the article title**, not the header brand name. `MONEY_PAGE_SLUGS` in `src/lib/site.ts` is the list. Do not put the brand name back as H1 on those four.

## Architecture

- **`src/app/(site)/[slug]/page.tsx` is a catch-all serving three things.** A root-level slug can be a post (`/price-of-alu-zinc-in-lagos/`), a page (`/pricelist/`) or a category archive (`/blogs/`) — WordPress strips the `/category/` base. Resolution order is **post → page → category**, matching WordPress. Do not split these into separate route segments; that would change URLs.
- **Public site lives under `src/app/(site)/`; Studio has its own root layout.** `robots.ts` must stay at the true `src/app/` root — a dynamic metadata route inside the route group 404s in Next 15.5.
- **`/blogs-and-projects/` is stored as a post**, not a page, but is served by its own route as the blog index. It's in `RESERVED_SLUGS`.
- **Content is Portable Text** with custom block types: `priceTable`, `legacyImage`, `youtube`, `callout`, `toolEmbed`, `htmlEmbed`.
- **`htmlEmbed` is the never-drop-content escape hatch.** Anything the importer can't confidently convert is preserved verbatim and logged. Never "clean up" by deleting these.
- **Images are dual-mode.** `legacyImage` holds either a Sanity asset or a `legacyUrl` pointing at `/wp-content/uploads/...`. Migrating all 200 images into Sanity on day one would change 200 URLs at the worst moment.
- **Interactive tools are content blocks (`toolEmbed`), not hard-coded routes**, because on the live page the length converter sits mid-content with prose above and below it.

## Conventions

- TypeScript, App Router, server components by default. `'use client'` only where there's genuine interactivity: `Header`, `SearchBox`, `RoofAreaCalculator`, `LengthConverter`, `CommentForm`, `WhatsAppFloat`.
- IndexNow is fired from `/api/revalidate` after a successful Sanity publish. The key file lives at `public/<INDEXNOW_KEY>.txt` and must stay reachable on the canonical host.
- Tailwind only, using the tokens in `tailwind.config.ts`. The canvas is **dark blue `#004aad` (`secondary`) with white text** — Elementor's global kit, not a white page. `#2f5aae` (`brand`) is the live site's `theme-color` and a distinct token; do not collapse the two. White islands (post cards, form fields, tool widgets, price-table first column) are deliberate.
- Import site-wide constants from `@/lib/site`, never hard-code phone numbers, URLs or account numbers.
- Prefer `absoluteUrl()` from `@/lib/seo` over string-concatenating URLs; it handles the trailing slash.
- Dates render `dd/mm/yyyy` via `@/lib/format` to match the live site.
- No new dependencies without saying why. The point of this migration is fewer moving parts than WordPress had.

## Current state

Cut over 2026-08-04. Latest verified work: money-page accessibility (comment contrast/tap targets + heading-order, 2026-08-16). Previous: aluminium PageSpeed pass, homepage contrast, Studio UX, Offer schema + H1 + IndexNow, Bing title/description fixes. `npm run verify` 110/110, GATE: PASSED. GSC baseline for the 90-day watch: **6.9k clicks / 297k impressions**.

**Still open:**

1. Cancel WordPress hosting only after Michael is comfortable — media is already on Blob.
2. Vercel deploys from GitHub on push to `main`.
3. T+60 (around early October 2026): consolidate thin tag archives — its own project, not mixed into other work.
4. Homepage staff testimonials are live (Michael, Adeshina, Jennifer Ogbodo). Swap Jennifer’s title/quote if Michael sends exact wording.
5. Duplicate `privacy-policy` / `about-us` post+page slugs still exist; catch-all is post-first.
6. Bing Webmaster "Recommendations" list will clear only after Bing recrawls.

## Gotchas

- **`MEDIA_ORIGIN` falling back to the live domain is a production outage.** After cutover the rewrite proxied `/wp-content/uploads/*` to itself (508). Then a Vercel edge cached the error body as HTTP 200 for 30 days. Confirm media fixes from a real browser on the reporter's path, not only `curl`.
- **Range requests through the `/wp-content/uploads/` rewrite poison the CDN cache.** Homepage video uses the Blob URL directly. Same move for any future video.
- **`sanity exec` patches can silently write a draft.** Filter `&& !(_id in path("drafts.**"))` and re-fetch the live page; the script's own "success" log is not proof.
- **`imageSrc()` must pass `source.asset`**, not the whole `legacyImage` object. `Malformed asset _ref ''` at build time is this bug.
- **Sanity revalidate webhook URL must include the trailing slash** (`/api/revalidate/`). A 308 on POST may never revalidate.
- **`/privacy-policy/` and `/about-us/` each exist as both a post and a page.** The catch-all resolves post-first, matching pre-cutover behaviour.
- **`/nine-factors-to-consider-when-choosing-a-roofing-material/` was absent from the WordPress sitemap** — Rank Math dropped it. It is in the new sitemap and in `scripts/verify-urls.mjs`.
- **`/thank-you-for-placing-an-order-with-us/` is `noindex`** (Michael: link-only). It still publishes bank account numbers. Do not flip it back to indexable.
- Roof calculator area is the **live formula** `L×W + W×H` (12×9×2.5 = **130.50 m²**), not Pythagoras. Rafter/slope/pitch stay real geometry as extra stats.
- Comments arrive **unapproved**; they appear nowhere until approved in the Studio.
- `/search/` is deliberately `noindex` and deliberately absent from the sitemap.

## Before you finish any task

- Run `npm run typecheck`. If you touched routing or metadata, run `npm run build`.
- If you touched anything under `src/app/`, `src/lib/seo.ts`, `src/lib/redirects.js` or `src/app/(site)/sitemap.ts`, re-run `npm run verify`.
- Don't claim something works if you haven't run it. Say what you verified and what you didn't.
