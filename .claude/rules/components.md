---
paths:
  - "src/components/**/*.tsx"
---

# Component rules

## Server vs client

Server components by default. `'use client'` only for genuine interactivity.
Currently client: `Header`, `SearchBox`, `RoofAreaCalculator`, `LengthConverter`,
`CommentForm`. Everything else renders on the server.

Comment TEXT must stay server-rendered. A JavaScript-loaded comment widget means
Google may never see it — and six genuine comments on the calculator page are
unique content no competitor has.

## Design

The brief was "keep the design as simple as it already is". Match the live site;
do not redesign. Palette tokens live in `tailwind.config.ts`; `#2f5aae` is the
live `theme-color`.

- Tailwind utilities only. No inline `style`, no CSS modules.
- Use `cn()` from `@/lib/cn` to join classes.
- `Container` for page width. Don't hand-roll `max-w-*` wrappers.

## Images

- `next/image` for photos. Always set `sizes`. Set `priority` only on the LCP
  image — the post hero, or the first card in a grid.
- SVGs use a plain `<img>`. Routing SVGs through the optimizer needs
  `dangerouslyAllowSVG`, which enables it for every remote image on the site.
- Images may be Sanity assets or legacy WordPress URLs. Always resolve via
  `imageSrc()` from `sanity/image.ts`; never read `.asset` directly.

## Accessibility

Most traffic is mobile Nigerian users, often on slow connections.

- Numeric inputs get `inputMode="decimal"` so phones show the number pad.
- Calculated results go in `<output>` with `aria-live="polite"`.
- Every interactive control needs an accessible name.
- Icon-only buttons need `aria-hidden` on the SVG and an `sr-only` label.

## Outbound links

`rel="noopener noreferrer nofollow"` on external links; internal links stay
followable or you leak your own internal PageRank. Comment author links are
always `nofollow ugc`.
