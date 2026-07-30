export function StarRating({
  rating,
  count,
  href,
}: {
  rating: number
  count: number
  href?: string
}) {
  const content = (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-accent">
            <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.83-.2-1.53-1.12l1.36-4.18a1 1 0 00-.37-1.12L1.75 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69l1.36-4.18Z" />
          </svg>
        ))}
      </span>
      <span className="font-semibold">{rating}</span>
      <span className="text-white/80">based on {count} reviews</span>
    </span>
  )

  if (!href) return content

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-opacity hover:opacity-80"
    >
      {content}
    </a>
  )
}

export default StarRating
