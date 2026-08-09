import { groq } from 'next-sanity'

/* ------------------------------------------------------------------ */
/* Fragments                                                           */
/* ------------------------------------------------------------------ */

const imageFields = `
  asset,
  legacyUrl,
  alt,
  caption,
  width,
  height
`

const seoFields = `
  seo {
    title,
    description,
    focusKeyword,
    canonicalUrl,
    noIndex,
    ogImage { ${imageFields} }
  }
`

const postCardFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  featuredImage { ${imageFields} },
  author->{ name, "slug": slug.current, avatarUrl, avatar { ${imageFields} } },
  categories[]->{ title, "slug": slug.current }
`

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/**
 * A single root-level slug can be a post, a page, or a category archive —
 * because WordPress strips the /category/ base. Resolution order matches
 * WordPress's own precedence, so a slug collision behaves identically to
 * how it behaves on the live site today.
 */
export const resolveSlugQuery = groq`{
  "post": *[_type == "post" && slug.current == $slug][0]._id,
  "page": *[_type == "page" && slug.current == $slug][0]._id,
  "category": *[_type == "category" && slug.current == $slug][0]._id
}`

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  excerpt,
  body[]{
    ...,
    _type == "legacyImage" => { ${imageFields} },
    _type == "imageCarousel" => {
      slides[]{ ..., image { asset, legacyUrl } }
    },
    markDefs[]{ ... }
  },
  featuredImage { ${imageFields} },
  publishedAt,
  updatedAt,
  videoUrl,
  readingTime,
  author->{ name, "slug": slug.current, role, bio, avatarUrl, avatar { ${imageFields} } },
  categories[]->{ title, "slug": slug.current },
  tags[]->{ title, "slug": slug.current },
  faq[]{ question, answer },
  ${seoFields}
}`

export const relatedPostsQuery = groq`*[
  _type == "post"
  && slug.current != $slug
  && count(categories[@._ref in $categoryIds]) > 0
] | order(publishedAt desc)[0...3]{ ${postCardFields} }`

export const allPostSlugsQuery = groq`*[_type == "post" && defined(slug.current)]{
  "slug": slug.current,
  updatedAt,
  publishedAt
}`

export const postsPageQuery = groq`{
  "posts": *[_type == "post" && slug.current != "blogs-and-projects"]
    | order(publishedAt desc)[$start...$end]{ ${postCardFields} },
  "total": count(*[_type == "post" && slug.current != "blogs-and-projects"])
}`

export const latestPostsQuery = groq`*[
  _type == "post" && slug.current != "blogs-and-projects"
] | order(publishedAt desc)[0...$limit]{ ${postCardFields} }`

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export const pageBySlugQuery = groq`*[_type == "page" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  heroImage { ${imageFields} },
  body[]{
    ...,
    _type == "legacyImage" => { ${imageFields} },
    _type == "imageCarousel" => {
      slides[]{ ..., image { asset, legacyUrl } }
    },
    markDefs[]{ ... }
  },
  publishedAt,
  updatedAt,
  faq[]{ question, answer },
  ${seoFields}
}`

export const allPageSlugsQuery = groq`*[_type == "page" && defined(slug.current)]{
  "slug": slug.current,
  updatedAt
}`

/* ------------------------------------------------------------------ */
/* Taxonomies                                                          */
/* ------------------------------------------------------------------ */

export const categoryBySlugQuery = groq`*[_type == "category" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  description,
  updatedAt,
  ${seoFields},
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc){ ${postCardFields} }
}`

export const tagBySlugQuery = groq`*[_type == "tag" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  "slug": slug.current,
  description,
  updatedAt,
  ${seoFields},
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc){ ${postCardFields} }
}`

export const allCategorySlugsQuery = groq`*[_type == "category" && defined(slug.current)]{
  "slug": slug.current,
  updatedAt
}`

export const allTagSlugsQuery = groq`*[_type == "tag" && defined(slug.current)]{
  "slug": slug.current,
  updatedAt
}`

/* ------------------------------------------------------------------ */
/* Authors                                                             */
/* ------------------------------------------------------------------ */

// WordPress's author-archive rewrite rule is case-insensitive (both
// /author/Ruth/ and /author/ruth/ 200 on the live site), so the lookup here
// matches case-insensitively too rather than 404ing on a differently-cased
// but otherwise-identical URL.
export const authorBySlugQuery = groq`*[_type == "author" && lower(slug.current) == lower($slug)][0]{
  _id,
  name,
  "slug": slug.current,
  role,
  bio,
  avatarUrl,
  avatar { ${imageFields} },
  "posts": *[_type == "post" && author._ref == ^._id] | order(publishedAt desc){ ${postCardFields} }
}`

export const allAuthorSlugsQuery = groq`*[_type == "author" && defined(slug.current)]{
  "slug": slug.current
}`

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]{
  title,
  description,
  reviewCount,
  reviewRating,
  announcementBar,
  stats,
  defaultOgImage { ${imageFields} }
}`

/** Used by middleware to resolve legacy /?p=123 and /?page_id=456 URLs. */
export const byLegacyIdQuery = groq`*[
  (_type == "post" || _type == "page") && legacyId == $id
][0]{ "slug": slug.current, _type }`

/** Everything the sitemap needs, in one round trip. */
export const sitemapQuery = groq`{
  "posts": *[_type == "post" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current, updatedAt, publishedAt
  },
  "pages": *[_type == "page" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current, updatedAt
  },
  "categories": *[_type == "category" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current, updatedAt
  },
  "tags": *[_type == "tag" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current, updatedAt
  },
  "authors": *[_type == "author" && defined(slug.current)]{ "slug": slug.current }
}`

/** Latest 20 posts for the RSS feed. */
export const feedQuery = groq`*[
  _type == "post" && slug.current != "blogs-and-projects"
] | order(publishedAt desc)[0...20]{
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  author->{ name }
}`

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/**
 * Site search across titles, excerpts and body text.
 *
 * Uses GROQ's `match` with a wildcard term rather than Sanity's paid search
 * API — at ~40 posts that is more than fast enough, and it costs nothing.
 * Title matches are boosted so an exact-title search lands first.
 */
export const searchQuery = groq`*[
  _type == "post"
  && slug.current != "blogs-and-projects"
  && (
    title match $term
    || excerpt match $term
    || pt::text(body) match $term
    || count(tags[@->title match $term]) > 0
  )
] | score(
  boost(title match $term, 3),
  boost(excerpt match $term, 2),
  pt::text(body) match $term
) | order(_score desc, publishedAt desc)[0...30]{ ${postCardFields} }`

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

/** Approved comments only. Unapproved ones are invisible to the site. */
export const commentsForDocumentQuery = groq`*[
  _type == "comment"
  && approved == true
  && post._ref == $documentId
] | order(publishedAt asc){
  _id,
  name,
  website,
  body,
  publishedAt,
  avatarUrl,
  legacyId,
  "parentId": parent._ref
}`

/* ------------------------------------------------------------------ */
/* Media for the sitemap                                               */
/* ------------------------------------------------------------------ */

/**
 * Images and videos per URL, so the sitemap can carry <image:image> and
 * <video:video> entries the way the Rank Math sitemaps did.
 */
export const sitemapMediaQuery = groq`{
  "posts": *[_type == "post" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current,
    updatedAt,
    publishedAt,
    title,
    excerpt,
    videoUrl,
    "images": [
      featuredImage,
      ...body[_type == "legacyImage"]
    ][defined(@)]{ asset, legacyUrl, alt }
  },
  "pages": *[_type == "page" && defined(slug.current) && seo.noIndex != true]{
    "slug": slug.current,
    updatedAt,
    "images": [
      heroImage,
      ...body[_type == "legacyImage"]
    ][defined(@)]{ asset, legacyUrl, alt }
  }
}`
