import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { sanityFetch } from '../../../../sanity/client'
import {
  postBySlugQuery,
  pageBySlugQuery,
  categoryBySlugQuery,
  relatedPostsQuery,
  allPostSlugsQuery,
  allPageSlugsQuery,
  allCategorySlugsQuery,
  commentsForDocumentQuery,
} from '../../../../sanity/queries'
import { imageSrc } from '../../../../sanity/image'

import { MONEY_PAGE_SLUGS, NO_HERO_IMAGE_SLUGS, RESERVED_SLUGS, site } from '@/lib/site'
import { buildMetadata, excerptFromBody } from '@/lib/seo'
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  graph,
  offerListSchema,
  organizationSchema,
  videoSchema,
  websiteSchema,
} from '@/lib/schema'
import { formatDate, isoDate, youtubeId } from '@/lib/format'

import Container from '@/components/Container'
import Breadcrumbs from '@/components/Breadcrumbs'
import PortableBody from '@/components/PortableBody'
import PostCard, { type PostCardData } from '@/components/PostCard'
import PageHeader from '@/components/PageHeader'
import JsonLd from '@/components/JsonLd'
import Comments, { type CommentData } from '@/components/Comments'
import TrustindexReviews from '@/components/TrustindexReviews'

/**
 * The catch-all that reproduces WordPress's flat URL structure.
 *
 * On the live site a root-level slug can be three different things:
 *   /price-of-alu-zinc-in-lagos/   → a post
 *   /pricelist/                    → a page
 *   /blogs/                        → a category archive (the /category/ base
 *                                     is stripped in your permalink settings)
 *
 * So this route resolves in that same precedence order. Doing it any other way
 * would silently change which content answers a URL, which is invisible in
 * testing and expensive in production.
 */

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

/* ------------------------------------------------------------------ */
/* Static params                                                       */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  try {
    const [posts, pages, categories] = await Promise.all([
      sanityFetch<Array<{ slug: string }>>({ query: allPostSlugsQuery }),
      sanityFetch<Array<{ slug: string }>>({ query: allPageSlugsQuery }),
      sanityFetch<Array<{ slug: string }>>({ query: allCategorySlugsQuery }),
    ])

    const slugs = [...posts, ...pages, ...categories]
      .map((d) => d.slug)
      .filter((s): s is string => Boolean(s) && !RESERVED_SLUGS.has(s))

    return Array.from(new Set(slugs)).map((slug) => ({ slug }))
  } catch {
    // Do not fail the build on a CMS hiccup. Pages fall back to on-demand
    // rendering, which is slower on first hit but not broken.
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

type Resolved =
  | { kind: 'post'; doc: any }
  | { kind: 'page'; doc: any }
  | { kind: 'category'; doc: any }
  | null

async function resolve(slug: string): Promise<Resolved> {
  if (RESERVED_SLUGS.has(slug)) return null

  const post = await sanityFetch<any>({
    query: postBySlugQuery,
    params: { slug },
    tags: ['post:' + slug],
  })
  if (post) return { kind: 'post', doc: post }

  const page = await sanityFetch<any>({
    query: pageBySlugQuery,
    params: { slug },
    tags: ['page:' + slug],
  })
  if (page) return { kind: 'page', doc: page }

  const category = await sanityFetch<any>({
    query: categoryBySlugQuery,
    params: { slug },
    tags: ['category:' + slug],
  })
  if (category) return { kind: 'category', doc: category }

  return null
}

/* ------------------------------------------------------------------ */
/* Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const resolved = await resolve(slug)
  if (!resolved) return { title: 'Not found', robots: { index: false, follow: true } }

  const { kind, doc } = resolved
  const path = '/' + slug + '/'

  if (kind === 'post') {
    return buildMetadata({
      path,
      title: doc.title,
      description: doc.excerpt,
      seo: doc.seo,
      image: doc.featuredImage,
      type: 'article',
      publishedTime: doc.publishedAt,
      modifiedTime: doc.updatedAt,
      authorName: doc.author?.name,
    })
  }

  if (kind === 'page') {
    return buildMetadata({
      path,
      title: doc.title,
      // Without this, pages with no seo.description fall through to
      // site.description (the homepage's) — every such page then shows the
      // homepage's meta description in search results instead of its own.
      description: excerptFromBody(doc.body),
      seo: doc.seo,
      image: doc.heroImage,
    })
  }

  return buildMetadata({
    path,
    // The layout applies no title suffix (matches live WordPress posts/pages);
    // category archive titles build their own, matching live WordPress.
    title: doc.title + ' | ' + site.name,
    description: doc.description,
    seo: doc.seo,
  })
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function SlugPage({ params }: Props) {
  const { slug } = await params
  const resolved = await resolve(slug)
  if (!resolved) notFound()

  if (resolved.kind === 'post') return <PostView post={resolved.doc} slug={slug} />
  if (resolved.kind === 'page') return <PageView page={resolved.doc} slug={slug} />
  return <CategoryView category={resolved.doc} slug={slug} />
}

/* ------------------------------------------------------------------ */
/* Post                                                                */
/* ------------------------------------------------------------------ */

async function PostView({ post, slug }: { post: any; slug: string }) {
  const categoryIds = (post.categories || [])
    .map((c: any) => c._id)
    .filter(Boolean)

  const [related, comments] = await Promise.all([
    categoryIds.length > 0
      ? sanityFetch<PostCardData[]>({
          query: relatedPostsQuery,
          params: { slug, categoryIds },
        }).catch(() => [])
      : Promise.resolve([] as PostCardData[]),
    sanityFetch<CommentData[]>({
      query: commentsForDocumentQuery,
      params: { documentId: post._id },
      tags: ['comment'],
    }).catch(() => [] as CommentData[]),
  ])

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blogs-and-projects/' },
    { name: post.title, path: '/' + slug + '/' },
  ]

  const heroSrc = imageSrc(post.featuredImage, 1200)
  // Metadata/structured-data image signals (og:image, JSON-LD) stay wired to
  // heroSrc regardless — only the on-page <figure> is suppressed for these
  // slugs. See NO_HERO_IMAGE_SLUGS in @/lib/site.
  const showHero = heroSrc && !NO_HERO_IMAGE_SLUGS.has(slug)
  const ytId = post.videoUrl ? youtubeId(post.videoUrl) : null

  return (
    <>
      <JsonLd
        data={graph(
          organizationSchema(),
          websiteSchema(),
          articleSchema({ ...post, slug }),
          breadcrumbSchema(crumbs),
          post.videoUrl
            ? videoSchema({
                url: post.videoUrl,
                title: post.title,
                description: post.excerpt,
                thumbnailUrl: ytId
                  ? 'https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg'
                  : heroSrc,
                uploadDate: post.publishedAt,
              })
            : null,
          post.faq?.length ? faqSchema(post.faq) : null,
          MONEY_PAGE_SLUGS.has(slug)
            ? offerListSchema({
                slug,
                title: post.title,
                updatedAt: post.updatedAt,
                body: post.body,
              })
            : null
        )}
      />

      <Container as="article" className="py-8 sm:py-12">
        <div className="mx-auto max-w-prose">
          <Breadcrumbs items={crumbs} />

          {post.categories?.length ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
              {post.categories.map((c: any) => c.title).join(' · ')}
            </p>
          ) : null}

          {/* Money pages: this title is the H1. Everywhere else the header
              brand name is the H1 and this stays an H2. Same classes either way. */}
          {MONEY_PAGE_SLUGS.has(slug) ? (
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              {post.title}
            </h1>
          ) : (
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              {post.title}
            </h2>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            {post.author?.name ? (
              <>
                <span>
                  by{' '}
                  <Link
                    href={'/author/' + post.author.slug + '/'}
                    className="font-medium text-white/85 transition-colors hover:text-white"
                  >
                    {post.author.name}
                  </Link>
                </span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            {post.publishedAt ? (
              <time dateTime={isoDate(post.publishedAt)}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
            {post.updatedAt && post.updatedAt !== post.publishedAt ? (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Updated{' '}
                  <time dateTime={isoDate(post.updatedAt)}>
                    {formatDate(post.updatedAt)}
                  </time>
                </span>
              </>
            ) : null}
            {post.readingTime ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime} min read</span>
              </>
            ) : null}
          </div>
        </div>

        {showHero ? (
          <figure className="mx-auto mt-8 max-w-3xl">
            <Image
              src={heroSrc}
              alt={post.featuredImage?.alt || post.title}
              width={1200}
              height={800}
              // The hero is the LCP element on every post. Priority-loading it
              // is most of the Core Web Vitals win over the WordPress build.
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full rounded-xl"
            />
            {post.featuredImage?.caption ? (
              <figcaption className="mt-2 text-center text-sm text-white/70">
                {post.featuredImage.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="mx-auto mt-8 max-w-prose">
          <PortableBody value={post.body} />

          <TrustindexReviews />

          {post.tags?.length ? (
            <div className="mt-10 border-t border-white/20 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Tags
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t: any) => (
                  <li key={t.slug}>
                    <Link
                      href={'/tag/' + t.slug + '/'}
                      className="inline-block rounded-full border border-white/30 px-3 py-1 text-sm text-white/85 transition-colors hover:border-white hover:text-white"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {post.author?.bio ? (
            <aside className="mt-10 flex gap-4 rounded-xl border border-white/20 bg-white/10 p-5">
              {post.author.avatarUrl || post.author.avatar ? (
                <Image
                  src={imageSrc(post.author.avatar, 128) || post.author.avatarUrl}
                  alt={post.author.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <div>
                <p className="font-semibold text-white">{post.author.name}</p>
                {post.author.role ? (
                  <p className="text-sm text-white/85">{post.author.role}</p>
                ) : null}
                <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                  {post.author.bio}
                </p>
              </div>
            </aside>
          ) : null}

          <CtaBlock />

          <Comments
            comments={comments}
            documentId={post._id}
            documentType="post"
          />
        </div>

        {related.length ? (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-white">Related reading</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

async function PageView({ page, slug }: { page: any; slug: string }) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: page.title, path: '/' + slug + '/' },
  ]
  const heroSrc = imageSrc(page.heroImage, 1600)
  // See NO_HERO_IMAGE_SLUGS in @/lib/site — metadata/schema keep referencing
  // page.heroImage regardless; only this on-page figure is suppressed.
  const showHero = heroSrc && !NO_HERO_IMAGE_SLUGS.has(slug)

  const comments = await sanityFetch<CommentData[]>({
    query: commentsForDocumentQuery,
    params: { documentId: page._id },
    tags: ['comment'],
  }).catch(() => [] as CommentData[])

  return (
    <>
      <JsonLd
        data={graph(
          organizationSchema(),
          websiteSchema(),
          breadcrumbSchema(crumbs),
          page.faq?.length ? faqSchema(page.faq) : null
        )}
      />

      <PageHeader title={page.title} />

      <Container className="py-10">
        <div className="mx-auto max-w-prose">
          <Breadcrumbs items={crumbs} />
        </div>

        {showHero ? (
          <figure className="mx-auto mb-8 max-w-4xl">
            <Image
              src={heroSrc}
              alt={page.heroImage?.alt || page.title}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="h-auto w-full rounded-xl"
            />
          </figure>
        ) : null}

        <div className="mx-auto max-w-prose">
          <PortableBody value={page.body} />
          <CtaBlock />

          <Comments
            comments={comments}
            documentId={page._id}
            documentType="page"
          />
        </div>
      </Container>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Category archive                                                    */
/* ------------------------------------------------------------------ */

function CategoryView({ category, slug }: { category: any; slug: string }) {
  const posts: PostCardData[] = category.posts || []
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: category.title, path: '/' + slug + '/' },
  ]

  return (
    <>
      <JsonLd
        data={graph(organizationSchema(), websiteSchema(), breadcrumbSchema(crumbs))}
      />

      <PageHeader title={category.title} description={category.description} />

      <Container className="py-10">
        <Breadcrumbs items={crumbs} />

        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <PostCard key={p._id} post={p} priority={i < 3} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-white/85">
            No posts in this category yet.
          </p>
        )}
      </Container>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Shared CTA                                                          */
/* ------------------------------------------------------------------ */

function CtaBlock() {
  return (
    <aside className="mt-12 rounded-xl bg-brand p-6 text-center text-white sm:p-8">
      <h2 className="text-xl font-bold sm:text-2xl">
        Need a quote for your roof?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
        Send us your roof plan or dimensions on WhatsApp and we will send back a
        detailed breakdown.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href={site.social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-50"
        >
          Chat on WhatsApp
        </a>
        <Link
          href="/pricelist/"
          className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          See current prices
        </Link>
      </div>
    </aside>
  )
}
