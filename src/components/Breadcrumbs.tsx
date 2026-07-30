import Link from 'next/link'

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; path: string }>
}) {
  if (items.length < 2) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-white/85">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="transition-colors hover:text-white">
                  {item.name}
                </Link>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
