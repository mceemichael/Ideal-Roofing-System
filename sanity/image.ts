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
function asSanityImage(value: unknown): Image | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { _ref?: string; _type?: string; asset?: { _ref?: string } }
  // Raw image field: { _type: 'image', asset: { _ref } } or a bare asset ref.
  if (v.asset?._ref || v._ref) return v as Image
  return null
}

export function imageSrc(
  source: { asset?: unknown; legacyUrl?: string } | null | undefined,
  width = 1200
): string | null {
  if (!source) return null
  // `source` is usually a `legacyImage` wrapper ({ asset, legacyUrl }).
  // Studio / carousel data sometimes nests one extra `asset` level. Try
  // both before falling back to the WordPress path.
  const image = asSanityImage(source) || asSanityImage(source.asset)
  if (image) {
    try {
      return urlForImage(image).width(width).url()
    } catch {
      // fall through to legacyUrl
    }
  }
  if (source.legacyUrl) return source.legacyUrl
  return null
}
