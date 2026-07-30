import Link from 'next/link'
import type { Metadata } from 'next'
import Container from '@/components/Container'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
        We could not find that page
      </h1>
      <p className="mx-auto mt-4 max-w-md text-ink-muted">
        The page may have moved. These are the ones people look for most:
      </p>

      <ul className="mx-auto mt-8 flex max-w-md flex-col gap-3">
        {[
          { label: 'Aluminium roofing sheet prices', href: '/price-of-aluminium-roofing-sheets-in-2026/' },
          { label: 'Stone coated (Gerard) prices', href: '/price-of-stone-coated-gerard-in-lagos-2025/' },
          { label: 'PVC rain gutter prices', href: '/price-of-pvc-rain-gutter-water-collector/' },
          { label: 'All pricelists', href: '/pricelist/' },
          { label: 'Blog', href: '/blogs-and-projects/' },
        ].map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-lg border border-surface-border px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Back to homepage
      </Link>
    </Container>
  )
}
