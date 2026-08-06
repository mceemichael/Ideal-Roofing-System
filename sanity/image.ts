import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'
import { dataset, projectId } from './env'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlForImage(source: Image) {
  return builder.image(source).auto('format').fit('max')
}

/**
 * Resolve an image to a URL regardless of whether it came from Sanity or was
 * left as a legacy /wp-content/uploads/ path by the migration script.
 */
export function imageSrc(
  source: { asset?: unknown; legacyUrl?: string } | null | undefined,
  width = 1200
): string | null {
  if (!source) return null
  if (source.asset) {
    // `source` is our `legacyImage` object shape ({ asset, legacyUrl, alt, ... }),
    // not a raw Sanity image field — the actual `{ asset: { _ref } }` structure
    // image-url needs is one level deeper, at `source.asset`. Passing `source`
    // itself works by accident for `legacyUrl`-only entries (falls through to the
    // branch below) but throws "Malformed asset _ref ''" for any entry that has
    // a real Sanity-uploaded asset, since `source.asset.asset._ref` doesn't match
    // the `source.asset._ref` shape image-url expects.
    return urlForImage(source.asset as Image).width(width).url()
  }
  if (source.legacyUrl) return source.legacyUrl
  return null
}
