---
paths:
  - "scripts/**/*.mjs"
---

# Migration script rules

`scripts/wp-to-sanity.mjs` runs once against real content and its mistakes are invisible
until traffic drops weeks later. Bias every decision toward preserving data.

## Never drop content

If markup can't be confidently converted, emit an `htmlEmbed` block containing
the original HTML and push a line to `warnings`. Never `return` without emitting
anything — that is silent content loss, the single most common cause of
post-migration ranking drops.

## Preserve exactly

- **Slugs**: verbatim from `wp:post_name`. No normalisation.
- **Dates**: `wp:post_date_gmt` is ALREADY UTC — call `toIso(v, { isGmt: true })`.
  Applying the WAT +01:00 offset to it shifts every timestamp by an hour.
- **Rank Math meta**: `rank_math_title`, `rank_math_description`,
  `rank_math_canonical_url`, `rank_math_robots`. These are what Google currently
  displays; changing them changes click-through.
- **Legacy IDs**: `wp:post_id` and `wp:comment_id`, for old `/?p=123` URLs and
  `#comment-468` anchors.

## Tables

Price tables are the ranking content on the pricelist posts. `tableToPriceTable`
must succeed, and if it can't, fall back to `htmlEmbed` AND warn loudly. Losing
one is losing the page.

## XML parsing

WXR uses namespaced tags. `querySelector('wp:post_id')` does NOT work in XML
mode — use `getElementsByTagName` via the `nsText` helper.

## Output

Report counts at the end and exit non-zero if any post produced an empty body.
The owner reads those numbers to decide whether the migration worked, so they
have to be honest and legible.
