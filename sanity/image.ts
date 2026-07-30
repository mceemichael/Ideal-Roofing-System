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
    return urlForImage(source as Image).width(width).url()
  }
  if (source.legacyUrl) return source.legacyUrl
  return null
}
