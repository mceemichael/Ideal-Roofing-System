import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Off. Next.js already caches pages (revalidate + the Studio webhook).
  // Sanity's CDN kept serving empty /roofprojects/ galleries after a publish.
  useCdn: false,
  perspective: 'published',
})

/**
 * Thin wrapper that applies our caching policy in one place.
 *
 * Pages are statically generated at build time and revalidated on publish via
 * the /api/revalidate webhook. The 1-hour fallback is a safety net for the
 * case where the webhook fails - content is never more than an hour stale.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = 3600,
}: {
  query: string
  params?: Record<string, unknown>
  tags?: string[]
  revalidate?: number | false
}): Promise<T> {
  return client.fetch<T>(query, params, {
    next: { revalidate: tags.length ? false : revalidate, tags },
  })
}
