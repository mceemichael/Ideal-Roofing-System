import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '../../../sanity/client'
import { searchQuery } from '../../../sanity/queries'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import PostCard, { type PostCardData } from '@/components/PostCard'
import SearchBox from '@/components/SearchBox'

/**
 * Site search — replaces the WordPress search box that sits in your header on
 * every page.
 *
 * Deliberately noindex. Search result pages are the textbook example of
 * low-value crawlable URLs: infinite variations, thin content, and Google's
 * own guidelines advise against letting them into the index. The box works for
 * visitors; the results stay out of search engines.
 */

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
}

export const revalidate = 3600

type Props = { searchParams: Promise<{ q?: string }> }

const POPULAR = [
  { label: 'Aluminium prices', href: '/price-of-aluminium-roofing-sheets-in-2026/' },
  { label: 'Stone coated prices', href: '/price-of-stone-coated-gerard-in-lagos-2025/' },
  { label: 'PVC rain gutter prices', href: '/price-of-pvc-rain-gutter-water-collector/' },
  { label: 'Roof area calculator', href: '/roof-area-calculator/' },
  { label: 'Colour chart', href: '/colour-chart-for-aluminium-roofing-sheet-in-nigeria/' },
  { label: 'Roofing budgets', href: '/tag/roof-budget/' },
]

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const term = (q || '').trim()

  const results: PostCardData[] = term
    ? await sanityFetch<PostCardData[]>({
        query: searchQuery,
        params: { term: '*' + term + '*' },
        tags: ['post'],
      }).catch(() => [])
    : []

  return (
    <>
      <PageHeader title="Search">
        <div className="mx-auto mt-6 max-w-lg">
          <SearchBox defaultValue={term} autoFocus />
        </div>
      </PageHeader>

      <Container className="py-10">
        {term ? (
          <>
            <p className="mb-6 text-sm text-white/85">
              {results.length === 0
                ? 'No results for '
                : results.length + (results.length === 1 ? ' result for ' : ' results for ')}
              <strong className="text-white">&ldquo;{term}&rdquo;</strong>
            </p>

            {results.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p, i) => (
                  <PostCard key={p._id} post={p} priority={i < 3} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/30 p-8 text-center">
                <p className="text-white/85">
                  Nothing matched that. Try a shorter word, or start from one of
                  these:
                </p>
                <PopularLinks />
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-white/85">
              Type above, or jump to what people look for most:
            </p>
            <PopularLinks />
          </div>
        )}
      </Container>
    </>
  )
}

function PopularLinks() {
  return (
    <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
      {POPULAR.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="inline-block rounded-full border border-white/30 px-4 py-2 text-sm text-white/85 transition-colors hover:border-white hover:text-white"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
