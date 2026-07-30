import CommentForm from './CommentForm'
import { formatDate, isoDate } from '@/lib/format'

export type CommentData = {
  _id: string
  name: string
  website?: string | null
  body: string
  publishedAt: string
  avatarUrl?: string | null
  legacyId?: number | null
  parentId?: string | null
}

/**
 * Reader comments, server-rendered.
 *
 * Two things worth noting:
 *
 * 1. The comment text is in the HTML at build time, not loaded by JavaScript.
 *    A JS-loaded comment widget (Disqus and friends) means Google may never
 *    see the text — and on a page like your roof calculator, six genuine
 *    comments are unique content that no competitor page has.
 *
 * 2. Old anchor links are preserved. WordPress gave each comment an
 *    id="comment-468" and people share those links. `legacyId` keeps them
 *    resolving to the same comment.
 */
export function Comments({
  comments,
  documentId,
  documentType,
}: {
  comments: CommentData[]
  documentId: string
  documentType: 'post' | 'page'
}) {
  // Build the reply tree. WordPress threads one level deep, so this does too.
  const topLevel = comments.filter((c) => !c.parentId)
  const repliesByParent = new Map<string, CommentData[]>()
  for (const c of comments) {
    if (!c.parentId) continue
    const list = repliesByParent.get(c.parentId) || []
    list.push(c)
    repliesByParent.set(c.parentId, list)
  }

  return (
    <section id="comments" className="mt-12 border-t border-white/20 pt-8">
      <h2 className="text-xl font-bold text-white sm:text-2xl">
        {comments.length === 0
          ? 'Leave a comment'
          : comments.length === 1
            ? '1 thought on this'
            : comments.length + ' thoughts on this'}
      </h2>

      {topLevel.length ? (
        <ol className="mt-6 space-y-6">
          {topLevel.map((c) => (
            <li key={c._id}>
              <Comment comment={c} />
              {repliesByParent.get(c._id)?.length ? (
                <ol className="mt-4 space-y-4 border-l-2 border-white/20 pl-4 sm:pl-6">
                  {repliesByParent.get(c._id)!.map((r) => (
                    <li key={r._id}>
                      <Comment comment={r} />
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      <CommentForm documentId={documentId} documentType={documentType} />
    </section>
  )
}

function Comment({ comment }: { comment: CommentData }) {
  const anchor = comment.legacyId
    ? 'comment-' + comment.legacyId
    : 'comment-' + comment._id

  return (
    <article
      id={anchor}
      className="scroll-mt-32 rounded-xl border border-white/20 bg-white/10 p-4 sm:p-5"
    >
      <header className="flex items-center gap-3">
        {comment.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.avatarUrl}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 rounded-full bg-white/20 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white"
          >
            {comment.name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {comment.website ? (
              <a
                href={comment.website}
                target="_blank"
                // nofollow: comment links are the classic spam vector, and
                // passing ranking value to arbitrary commenter sites is how
                // you attract more of it.
                rel="nofollow noopener noreferrer ugc"
                className="hover:underline"
              >
                {comment.name}
              </a>
            ) : (
              comment.name
            )}
          </p>
          <p className="text-xs text-white/70">
            <a href={'#' + anchor} className="hover:text-white">
              <time dateTime={isoDate(comment.publishedAt)}>
                {formatDate(comment.publishedAt)}
              </time>
            </a>
          </p>
        </div>
      </header>

      <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">
        {comment.body}
      </div>
    </article>
  )
}

export default Comments
