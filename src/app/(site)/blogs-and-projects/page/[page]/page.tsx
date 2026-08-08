import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '../../../../../../sanity/client'
import { postsPageQuery } from '../../../../../../sanity/queries'
import { POSTS_PER_PAGE } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import PostCard, { type PostCardData } from '@/components/PostCard'
import Pagination from '@/components/Pagination'

export const revalidate = 3600

type Props = { params: Promise<{ page: string }> }

/**
 * Reproduces the WordPress pagination URLs: /blogs-and-projects/page/2/.
 * Page 1 is handled by the parent route and 301s from /page/1/ (redirects.js)
 * so the index never has a duplicate.
 */
export async function generateStaticParams() {
  try {
    const { total } = await sanityFetch<{ total: number }>({
      query: postsPageQuery,
      params: { start: 0, end: 1 },
    })
    const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      page: String(i + 2),
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params
  const n = Number(page)
  return {
    ...buildMetadata({
      path: '/blogs-and-projects/page/' + n + '/',
      title: 'Blog - Page ' + n,
    }),
    // Page 2+ is self-canonical. Canonicalising these back to page 1 is a
    // common mistake that hides every post beyond the first page from Google.
  }
}

export default async function BlogPage({ params }: Props) {
  const { page } = await params
  const current = Number(page)
  if (!Number.isInteger(current) || current < 2) notFound()

  const start = (current - 1) * POSTS_PER_PAGE
  const { posts, total } = await sanityFetch<{ posts: PostCardData[]; total: number }>({
    query: postsPageQuery,
    params: { start, end: start + POSTS_PER_PAGE },
    tags: ['post'],
  })

  if (!posts.length) notFound()

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

  return (
    <>
      <PageHeader title="Blog" description={'Page ' + current + ' of ' + totalPages} />
      <Container className="py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
        <Pagination
          basePath="/blogs-and-projects/"
          currentPage={current}
          totalPages={totalPages}
        />
      </Container>
    </>
  )
}
