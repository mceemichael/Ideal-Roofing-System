import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch } from '../../../../../sanity/client'
import { authorBySlugQuery, allAuthorSlugsQuery } from '../../../../../sanity/queries'
import { imageSrc } from '../../../../../sanity/image'
import { buildMetadata } from '@/lib/seo'
import Container from '@/components/Container'
import Breadcrumbs from '@/components/Breadcrumbs'
import PostCard, { type PostCardData } from '@/components/PostCard'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const authors = await sanityFetch<Array<{ slug: string }>>({
      query: allAuthorSlugsQuery,
    })
    return authors.filter((a) => a.slug).map((a) => ({ slug: a.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = await sanityFetch<any>({ query: authorBySlugQuery, params: { slug } })
  if (!author) return { title: 'Not found', robots: { index: false, follow: true } }

  const postCount = (author.posts || []).length
  const articleWord = postCount === 1 ? 'article' : 'articles'

  return buildMetadata({
    path: '/author/' + slug + '/',
    title: 'Posts by ' + author.name,
    description:
      author.bio ||
      postCount + ' roofing ' + articleWord + ' by ' + author.name +
        ' at Ideal Roofing System, Nigeria\'s trusted roofing supplier and installer.',
  })
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const author = await sanityFetch<any>({
    query: authorBySlugQuery,
    params: { slug },
    tags: ['author:' + slug],
  })
  if (!author) notFound()

  const posts: PostCardData[] = author.posts || []
  const avatar = imageSrc(author.avatar, 160) || author.avatarUrl

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blogs-and-projects/' },
          { name: author.name, path: '/author/' + slug + '/' },
        ]}
      />

      <header className="flex flex-col items-center gap-4 border-b border-white/20 pb-8 text-center sm:flex-row sm:text-left">
        {avatar ? (
          <Image
            src={avatar}
            alt={author.name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : null}
        <div>
          {/* H2, not H1 — the site's single H1 lives in the header. */}
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{author.name}</h2>
          {author.role ? <p className="text-white/85">{author.role}</p> : null}
          {author.bio ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              {author.bio}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <PostCard key={p._id} post={p} priority={i < 3} />
        ))}
      </div>
    </Container>
  )
}
