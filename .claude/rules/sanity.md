---
paths:
  - "sanity/**/*.ts"
  - "sanity.config.ts"
---

# Sanity schema and query rules

## Schemas

- A new document or object type must be imported AND added to the array in
  `sanity/schemas/index.ts`. Forgetting the array is the usual bug: the Studio
  silently ignores the type.
- New block types used in body content must also be added to the `of:` array in
  BOTH `sanity/schemas/post.ts` and `sanity/schemas/page.ts`, and given a renderer in
  `src/components/PortableBody.tsx`. Miss the renderer and the content vanishes
  from the page while still existing in the CMS — silent content loss.
- `slug` fields are URLs. Never add normalisation, trimming or "cleanup" logic.
- Keep `legacyId` and `legacyUrl` fields. They are how old WordPress URLs and
  `#comment-468` anchors keep resolving. They look like cruft; they are not.

## Queries

- Add queries to `sanity/queries.ts`, reusing the `postCardFields` and
  `imageFields` fragments so listing shapes stay consistent.
- Fetch through `sanityFetch()` from `sanity/client.ts`, never `client.fetch`
  directly — the wrapper is where the caching policy lives.
- Pass a `tags` array so the `/api/revalidate` webhook can invalidate precisely.
  Convention: `'post'` for anything listing posts, `'post:<slug>'` for one.
- Comment queries MUST filter `approved == true`. Unapproved comments are
  untrusted user input.

## Migration safety

The dataset holds the only copy of migrated content until cutover. `--replace`
on a dataset import overwrites. Before suggesting it on a dataset that has had
manual edits, say so and offer `npx sanity dataset export` first.
