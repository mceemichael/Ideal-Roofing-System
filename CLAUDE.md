# Ideal Roofing System — WordPress → Vercel migration

Migrating the live site **idealroofingsystem.com** off WordPress onto Next.js 15 + Sanity + Vercel, **without losing search rankings**. The site is a Nigerian roofing company; its pricelist pages are the commercial core and its main organic earners.

**The site has NOT been cut over yet.** WordPress is still live and serving real traffic. Nothing in this repo is public.

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

`scripts/verify-urls.mjs` is the **gate before DNS cutover**. It must be green.

## Non-negotiable invariants

Breaking any of these costs real search traffic. Do not change them without saying so explicitly.

1. **`trailingSlash: true` in `next.config.mjs`.** WordPress serves `/slug/`. Turning this off points every indexed URL and backlink at a redirect, site-wide, on the same day.
2. **Slugs never change.** A slug is a URL is a ranking. If one genuinely must change, add a 301 to `src/lib/redirects.js` in the same edit.
3. **`publishedAt` / `updatedAt` are preserved, never regenerated.** They drive sitemap `lastmod`. If every date became today, Google reads it as a site-wide rewrite.
4. **The `verification` block in `src/app/layout.tsx` stays.** Those tags prove domain ownership to Google, Bing, Facebook, Pinterest. Removing one silently breaks a tool or ad account weeks later.
5. **`/wp-content/uploads/*` must keep resolving.** Rewrite in `next.config.mjs`. Images rank in Google Images and are hotlinked from Pinterest.
6. **Never expose `SANITY_API_WRITE_TOKEN` client-side.** Server routes only.

## Architecture

- **`src/app/[slug]/page.tsx` is a catch-all serving three things.** A root-level slug can be a post (`/price-of-alu-zinc-in-lagos/`), a page (`/pricelist/`) or a category archive (`/blogs/`) — WordPress strips the `/category/` base. Resolution order is **post → page → category**, matching WordPress. Do not split these into separate route segments; that would change URLs.
- **`/blogs-and-projects/` is stored as a post**, not a page, but is served by its own route as the blog index. It's in `RESERVED_SLUGS`.
- **Content is Portable Text** with custom block types: `priceTable`, `legacyImage`, `youtube`, `callout`, `toolEmbed`, `htmlEmbed`.
- **`htmlEmbed` is the never-drop-content escape hatch.** Anything the importer can't confidently convert is preserved verbatim and logged. Never "clean up" by deleting these.
- **Images are dual-mode.** `legacyImage` holds either a Sanity asset or a `legacyUrl` pointing at `/wp-content/uploads/...`. Migrating all 200 images into Sanity on day one would change 200 URLs at the worst moment.
- **Interactive tools are content blocks (`toolEmbed`), not hard-coded routes**, because on the live page the length converter sits mid-content with prose above and below it.

## Conventions

- TypeScript, App Router, server components by default. `'use client'` only where there's genuine interactivity: `Header`, `SearchBox`, `RoofAreaCalculator`, `LengthConverter`, `CommentForm`.
- Tailwind only, using the tokens in `tailwind.config.ts`. Brand colour `#2f5aae` is the live site's `theme-color` — it's the anchor of the palette.
- Import site-wide constants from `@/lib/site`, never hard-code phone numbers, URLs or account numbers.
- Prefer `absoluteUrl()` from `@/lib/seo` over string-concatenating URLs; it handles the trailing slash.
- Dates render `dd/mm/yyyy` via `@/lib/format` to match the live site.
- No new dependencies without saying why. The point of this migration is fewer moving parts than WordPress had.

## Current state

Built and verified by static analysis: routing, SEO parity, Sanity schemas, importer, calculators, comments, search, sitemap.

**Not yet done** (in rough priority order):

1. `npm install` and a real `npm run build` have **never been run** — the environment this was authored in had no npm registry access. Expect small fixes on first build; that is normal and expected, not a sign something is broken.
2. `src/lib/site.ts` → `business` block still has `TODO`s: street address, postcode, lat/long. Must match the Google Business Profile **exactly**.
3. `public/favicon.ico` and `public/apple-touch-icon.png` missing.
4. Rank Math redirects not yet pasted into `src/lib/redirects.js`.
5. The roof area formula was inferred from the live page's inputs, not its source. **Verify against the live calculator**: 12 × 9 × 2.5 should give **123.55 m²**.

## Gotchas

- **npm registry may be restricted in some sandboxes.** If `npm install` 403s, that's the environment, not the code.
- **`/privacy-policy/` and `/about-us/` each exist as both a post and a page** in WordPress. The catch-all resolves post-first, matching current behaviour.
- **`/nine-factors-to-consider-when-choosing-a-roofing-material/` is live but absent from the WordPress sitemap** — Rank Math is dropping it. It is included in the new sitemap and in `scripts/verify-urls.mjs`.
- **`/thank-you-for-placing-an-order-with-us/` carries bank account numbers** and currently has `6115105062` as its meta description. It is indexed. Worth discussing whether it should be `noindex`.
- Comments arrive **unapproved**; they appear nowhere until approved in the Studio.
- `/search/` is deliberately `noindex` and deliberately absent from the sitemap.

## Before you finish any task

- Run `npm run typecheck`. If you touched routing or metadata, run `npm run build`.
- If you touched anything under `src/app/`, `src/lib/seo.ts`, `src/lib/redirects.js` or `src/app/sitemap.ts`, re-run `npm run verify`.
- Don't claim something works if you haven't run it. Say what you verified and what you didn't.
