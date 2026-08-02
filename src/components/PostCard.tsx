import Image from 'next/image'
import Link from 'next/link'
import { imageSrc } from '../../sanity/image'
import { formatDate, isoDate } from '@/lib/format'

export type PostCardData = {
  _id: string
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  featuredImage?: any
  author?: { name?: string; slug?: string } | null
  categories?: Array<{ title: string; slug: string }> | null
}

export function PostCard({
  post,
  priority = false,
}: {
  post: PostCardData
  priority?: boolean
}) {
  const href = '/' + post.slug + '/'
  const img = imageSrc(post.featuredImage, 800)

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-surface-border bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {img ? (
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden">
          <Image
            src={img}
            alt={post.featuredImage?.alt || post.title}
            width={800}
            height={533}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        {post.categories?.length ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
            {post.categories[0].title}
          </p>
        ) : null}

        <h2 className="text-lg font-bold leading-snug text-cta">
          <Link href={href} className="transition-opacity hover:opacity-80">
            {post.title}
          </Link>
        </h2>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
            {post.excerpt}
          </p>
        ) : null}

        <Link
          href={href}
          className="mt-3 inline-block self-start text-xs font-bold uppercase tracking-wide text-cta transition-opacity hover:opacity-80"
        >
          Read More »
        </Link>

        <div className="mt-auto flex items-center gap-2 border-t border-surface-border pt-3 text-xs text-ink-light">
          {post.author?.name ? (
            <>
              {post.author.slug ? (
                <Link
                  href={'/author/' + post.author.slug + '/'}
                  className="transition-colors hover:text-brand"
                >
                  {post.author.name}
                </Link>
              ) : (
                <span>{post.author.name}</span>
              )}
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          {post.publishedAt ? (
            <time dateTime={isoDate(post.publishedAt)}>
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default PostCard
