import Link from 'next/link'
import { cn } from '@/lib/cn'

/**
 * Matches the WordPress pagination URLs exactly: /blogs-and-projects/page/2/.
 * Page 1 is the bare base path, never /page/1/ - that would be a duplicate of
 * the index, which is why redirects.js 301s it.
 */
export function Pagination({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string
  currentPage: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => (p <= 1 ? basePath : basePath + 'page/' + p + '/')
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const linkClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors'

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <li>
            <Link
              href={href(currentPage - 1)}
              rel="prev"
              className={cn(linkClass, 'border-white/30 text-white hover:border-white')}
            >
              « Previous
            </Link>
          </li>
        ) : null}

        {pages.map((p) => (
          <li key={p}>
            {p === currentPage ? (
              <span
                aria-current="page"
                className={cn(linkClass, 'border-brand bg-brand text-white')}
              >
                {p}
              </span>
            ) : (
              <Link
                href={href(p)}
                className={cn(linkClass, 'border-white/30 text-white hover:border-white')}
              >
                {p}
              </Link>
            )}
          </li>
        ))}

        {currentPage < totalPages ? (
          <li>
            <Link
              href={href(currentPage + 1)}
              rel="next"
              className={cn(linkClass, 'border-white/30 text-white hover:border-white')}
            >
              Next »
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}

export default Pagination
