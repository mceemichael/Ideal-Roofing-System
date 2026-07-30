import type { Metadata } from 'next'
import { sanityFetch } from '../../../sanity/client'
import { postsPageQuery } from '../../../sanity/queries'
import { POSTS_PER_PAGE } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema, graph, organizationSchema, websiteSchema } from '@/lib/schema'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import PostCard, { type PostCardData } from '@/components/PostCard'
import Pagination from '@/components/Pagination'
import JsonLd from '@/components/JsonLd'

export const revalidate = 3600

// Matches the live meta description on /blogs-and-projects/ exactly.
const DESCRIPTION =
  'Need to know more about roofing before you embark on your project? You are at the right place. Our roof blog is dynamic as we talk about types of roofing sheets in Nigeria, cost of roofing in Nigeria'

export const metadata: Metadata = buildMetadata({
  path: '/blogs-and-projects/',
  title: 'Blog',
  description: DESCRIPTION,
})

export default async function BlogIndex() {
  const { posts, total } = await sanityFetch<{ posts: PostCardData[]; total: number }>({
    query: postsPageQuery,
    params: { start: 0, end: POSTS_PER_PAGE },
    tags: ['post'],
  })

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blogs-and-projects/' },
  ]

  return (
    <>
      <JsonLd data={graph(organizationSchema(), websiteSchema(), breadcrumbSchema(crumbs))} />

      <PageHeader
        title="Blog"
        description="Leading Engineers and Architects Recommend Us!"
      />

      <Container className="py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard key={post._id} post={post} priority={i < 3} />
          ))}
        </div>

        <Pagination basePath="/blogs-and-projects/" currentPage={1} totalPages={totalPages} />
      </Container>
    </>
  )
}
