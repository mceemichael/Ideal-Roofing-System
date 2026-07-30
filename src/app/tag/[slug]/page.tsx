import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '../../../../sanity/client'
import { tagBySlugQuery, allTagSlugsQuery } from '../../../../sanity/queries'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema, graph, organizationSchema, websiteSchema } from '@/lib/schema'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import Breadcrumbs from '@/components/Breadcrumbs'
import PostCard, { type PostCardData } from '@/components/PostCard'
import JsonLd from '@/components/JsonLd'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const tags = await sanityFetch<Array<{ slug: string }>>({ query: allTagSlugsQuery })
    return tags.filter((t) => t.slug).map((t) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await sanityFetch<any>({ query: tagBySlugQuery, params: { slug } })
  if (!tag) return { title: 'Not found', robots: { index: false, follow: true } }

  return buildMetadata({
    path: '/tag/' + slug + '/',
    title: tag.title,
    description:
      tag.description ||
      'Roofing articles tagged ' + tag.title + ' from Ideal Roofing System.',
    seo: tag.seo,
  })
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params
  const tag = await sanityFetch<any>({
    query: tagBySlugQuery,
    params: { slug },
    tags: ['tag:' + slug],
  })
  if (!tag) notFound()

  const posts: PostCardData[] = tag.posts || []
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blogs-and-projects/' },
    { name: tag.title, path: '/tag/' + slug + '/' },
  ]

  return (
    <>
      <JsonLd data={graph(organizationSchema(), websiteSchema(), breadcrumbSchema(crumbs))} />

      <PageHeader title={tag.title} description={tag.description} />

      <Container className="py-10">
        <Breadcrumbs items={crumbs} />

        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <PostCard key={p._id} post={p} priority={i < 3} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-ink-muted">
            Nothing tagged {tag.title} yet.
          </p>
        )}
      </Container>
    </>
  )
}
